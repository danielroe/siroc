import { dirname, resolve } from 'path'
import {
  chmod,
  copy,
  existsSync,
  readJSONSync,
  remove,
  writeFile,
} from 'fs-extra'

import consola, { Consola } from 'consola'
import execa from 'execa'
import { RollupOptions } from 'rollup'
import sortPackageJson from 'sort-package-json'

import {
  asArray,
  glob,
  runInParallel,
  sortObjectKeys,
  tryRequire,
  RequireProperties,
} from '../utils'
import type {
  BuildConfigOptions,
  PackageHookOptions,
  PackageHooks,
} from '../build'
import type { PackageJson } from './types'

interface DefaultPackageOptions {
  rootDir: string
  build: boolean
  suffix: string
  hooks: PackageHooks
  linkedDependencies?: string[]
  sortDependencies?: boolean
  rollup?: BuildConfigOptions & RollupOptions
}

export type PackageOptions = Partial<DefaultPackageOptions>

export interface BuildOptions {
  dev?: boolean
  watch?: boolean
}

// 'package.js' is legacy and will go
const configPaths = ['siroc.config.js', 'package.js']

const DEFAULTS: DefaultPackageOptions = {
  rootDir: process.cwd(),
  build: true,
  suffix: process.env.PACKAGE_SUFFIX ? `-${process.env.PACKAGE_SUFFIX}` : '',
  hooks: {},
}

export class Package {
  options: DefaultPackageOptions
  logger: Consola
  pkg: RequireProperties<PackageJson, 'name' | 'version'>

  constructor(options: PackageOptions = {}) {
    this.options = Object.assign({}, DEFAULTS, options)

    // Basic logger
    this.logger = consola

    this.pkg = this.readPackageJSON()

    // Use tagged logger
    this.logger = consola.withTag(this.pkg.name)

    this.loadConfig()
  }

  private readPackageJSON(): this['pkg'] {
    return readJSONSync(this.resolvePath('package.json'))
  }

  resolvePath(...pathSegments: string[]) {
    return resolve(this.options.rootDir, ...pathSegments)
  }

  loadConfig() {
    configPaths.some(path => {
      const configPath = this.resolvePath(path)
      const config = tryRequire<PackageOptions>(configPath)
      if (!config) return false

      Object.assign(this.options, config)
    })
  }

  async callHook<H extends keyof PackageHookOptions>(
    name: H,
    options: PackageHookOptions[H]
  ) {
    const fns = this.options.hooks[name]

    if (!fns) return

    const fnArray = Array.isArray(fns) ? fns : [fns]
    try {
      await runInParallel(fnArray, async fn => fn(this, options))
    } catch (e) {
      this.logger.error(`Couldn't run hook for ${this.pkg.name}.`)
    }
  }

  load(relativePath: string, opts?: PackageOptions) {
    return new Package(
      Object.assign(
        {
          rootDir: this.resolvePath(relativePath),
        },
        opts
      )
    )
  }

  async writePackage() {
    if (this.options.sortDependencies) this.sortDependencies()

    const pkgPath = this.resolvePath('package.json')
    this.logger.debug('Writing', pkgPath)
    await writeFile(pkgPath, JSON.stringify(this.pkg, null, 2) + '\n')
  }

  generateVersion() {
    const date = Math.round(Date.now() / (1000 * 60))
    const gitCommit = this.gitShortCommit()
    const baseVersion = this.pkg.version.split('-')[0]
    this.pkg.version = `${baseVersion}-${date}.${gitCommit}`
  }

  suffixAndVersion() {
    this.logger.info(`Adding suffix ${this.options.suffix}`)

    const oldPkgName = this.pkg.name

    // Add suffix to the package name
    if (!oldPkgName.includes(this.options.suffix)) {
      this.pkg.name += this.options.suffix
    }

    // Apply suffix to all linkedDependencies
    if (this.pkg.dependencies) {
      for (const oldName of this.options.linkedDependencies || []) {
        const name = oldName + this.options.suffix
        const version =
          this.pkg.dependencies[oldName] || this.pkg.dependencies[name]

        delete this.pkg.dependencies[oldName]
        this.pkg.dependencies[name] = version
      }
    }

    if (typeof this.pkg.bin === 'string') {
      const { bin } = this.pkg
      this.pkg.bin = {
        [oldPkgName]: bin,
        [this.pkg.name]: bin,
      }
    }

    this.generateVersion()
  }

  syncLinkedDependencies() {
    // Apply suffix to all linkedDependencies
    for (const _name of this.options.linkedDependencies || []) {
      const name = _name + (this.options.suffix || '')

      // Try to read pkg
      const pkg =
        tryRequire<PackageJson>(`${name}/package.json`) ||
        tryRequire<PackageJson>(`${_name}/package.json`)

      // Skip if pkg or dependency not found
      if (
        !pkg ||
        !pkg.version ||
        !this.pkg.dependencies ||
        !this.pkg.dependencies[name]
      ) {
        continue
      }

      // Current version
      const currentVersion = this.pkg.dependencies[name]
      const caret = currentVersion[0] === '^'

      // Sync version
      this.pkg.dependencies[name] = caret ? `^${pkg.version}` : pkg.version
    }
  }

  async removeBuildFolders(config: RollupOptions[]) {
    const directories = new Set<string>()
    config.forEach(conf => {
      asArray(conf.output).forEach(conf => {
        if (!conf) return
        const dir = conf.dir || dirname(conf.file || '')
        if (!dir.includes('src')) directories.add(dir)
      })
    })
    for (const dir of directories) {
      await remove(dir)
    }
  }

  publish(tag = 'latest') {
    this.logger.info(
      `publishing ${this.pkg.name}@${this.pkg.version} with tag ${tag}`
    )
    this.exec('npm', `publish --tag ${tag}`)
  }

  copyFieldsFrom(source: Package, fields: Array<keyof PackageJson> = []) {
    for (const field of fields) {
      ;(this.pkg[field] as any) = source.pkg[field] as any
    }
  }

  async copyFilesFrom(source: Package, files: string[]) {
    for (const file of files || source.pkg.files || []) {
      const src = resolve(source.options.rootDir, file)
      const dst = resolve(this.options.rootDir, file)
      await copy(src, dst)
    }
  }

  autoFix() {
    this.pkg = sortPackageJson(this.pkg)
    this.sortDependencies()
  }

  sortDependencies() {
    if (this.pkg.dependencies) {
      this.pkg.dependencies = sortObjectKeys(this.pkg.dependencies)
    }

    if (this.pkg.devDependencies) {
      this.pkg.devDependencies = sortObjectKeys(this.pkg.devDependencies)
    }
  }

  exec(command: string, args: string, silent = false) {
    const fullCommand = `${command} ${args}`
    const r = execa.commandSync(fullCommand, {
      cwd: this.options.rootDir,
      env: process.env,
    })

    if (!silent) {
      if (r.failed) {
        this.logger.error(fullCommand, r.stderr.trim())
      } else {
        this.logger.success(fullCommand, r.stdout.trim())
      }
    }

    return {
      signal: r.signal,
      stdout: String(r.stdout).trim(),
      stderr: String(r.stderr).trim(),
    }
  }

  get binaries() {
    const { bin } = this.pkg
    const files = !bin
      ? []
      : typeof bin === 'string'
      ? [bin]
      : Object.values(bin)
    return Array.from(new Set(files.map(file => this.resolvePath(file))))
  }

  setBinaryPermissions() {
    return this.binaries.map(file => chmod(file, 0o777))
  }

  async getWorkspacePackages(packageNames?: string[]) {
    const packages: Package[] = []

    const dirs = new Set<string>()
    await Promise.all(
      (this.pkg.workspaces || ['.']).map(async workspace =>
        (await glob(workspace)).forEach(dir => dirs.add(dir))
      )
    )

    for (const dir of dirs) {
      if (existsSync(this.resolvePath(dir, 'package.json'))) {
        const pkg = new Package({
          ...this.options,
          rootDir: this.resolvePath(dir),
        })
        if (!packageNames || packageNames.includes(pkg.pkg.name)) {
          packages.push(pkg)
        }
      } else {
        this.logger.warn('Invalid workspace package:', dir)
      }
    }

    return packages
  }

  gitShortCommit() {
    const { stdout } = this.exec('git', 'rev-parse --short HEAD', true)
    return stdout
  }

  gitBranch() {
    const { stdout } = this.exec('git', 'rev-parse --abbrev-ref HEAD', true)
    return stdout
  }
}

export * from './types'
