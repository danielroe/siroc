import { basename, dirname, relative, resolve } from 'path'

import { bold } from 'chalk'
import consola, { Consola } from 'consola'
import execa from 'execa'
import {
  copy,
  existsSync,
  readJSONSync,
  writeFile,
  mkdirp,
  chmod,
} from 'fs-extra'
import { RollupOptions } from 'rollup'
import sortPackageJson from 'sort-package-json'

import type {
  BuildConfigOptions,
  PackageHookOptions,
  PackageHooks,
} from '../build'
import {
  glob,
  runInParallel,
  sortObjectKeys,
  tryJSON,
  tryRequire,
  RequireProperties,
} from '../utils'
import type { PackageJson } from './types'

interface DefaultPackageOptions {
  rootDir: string
  build: boolean
  suffix: string
  hooks: PackageHooks
  pkg?: PackageJson
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
const configPaths = [
  'siroc.config.ts',
  'siroc.config.js',
  'siroc.config.json',
  'package.js',
]

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

    this.pkg = this.loadPackageJSON()

    // Use tagged logger
    this.logger = consola.withTag(this.pkg.name)

    this.loadConfig()
  }

  loadPackageJSON(): this['pkg'] {
    try {
      return readJSONSync(this.resolvePath('package.json'))
    } catch {
      if (this.options.rootDir === '/') {
        this.logger.error(
          `Could not locate a ${bold('package.json')} in ${bold(
            DEFAULTS.rootDir
          )} or its parent directories.`
        )
        throw new Error(
          `Could not locate a package.json in ${DEFAULTS.rootDir} or its parent directories.`
        )
      }
      this.options.rootDir = this.resolvePath('..')
      return this.loadPackageJSON()
    }
  }

  /**
   * Resolve path relative to this package
   */
  resolvePath(...pathSegments: string[]) {
    return resolve(this.options.rootDir, ...pathSegments)
  }

  /**
   * Load options from the `siroc.config.js` in the package directory
   */
  loadConfig() {
    configPaths.some(path => {
      const configPath = this.resolvePath(path)

      const config = tryRequire<PackageOptions>(configPath)
      if (!config) return false

      Object.assign(this.options, config)
      return true
    })
  }

  /**
   * Call hooks defined in config file
   */
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

  /**
   * Return a new package in a directory relative to the current package
   */
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

  /**
   * Write updated `package.json`
   */
  async writePackage() {
    const pkgPath = this.resolvePath('package.json')
    this.logger.debug('Writing', pkgPath)
    await writeFile(pkgPath, JSON.stringify(this.pkg, null, 2) + '\n')
  }

  /**
   * A version string unique to the current git commit and date
   */
  get version() {
    const date = Math.round(Date.now() / (1000 * 60))
    const gitCommit = this.shortCommit
    const baseVersion = this.pkg.version.split('-')[0]
    return `${baseVersion}-${date}.${gitCommit}`
  }

  /**
   * Add suffix to all dependencies and set new version
   */
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

    this.pkg.version = this.version
  }

  /**
   * Synchronise version across all packages in monorepo
   */
  syncLinkedDependencies() {
    // Apply suffix to all linkedDependencies
    for (const _name of this.options.linkedDependencies || []) {
      const name = _name + (this.options.suffix || '')

      // Try to read pkg
      const pkg =
        tryJSON<PackageJson>(`${name}/package.json`) ||
        tryJSON<PackageJson>(`${_name}/package.json`)

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

  publish(tag = 'latest') {
    this.logger.info(
      `publishing ${this.pkg.name}@${this.pkg.version} with tag ${tag}`
    )
    this.exec('npm', `publish --tag ${tag}`)
  }

  /**
   * Synchronise fields from another package to this package
   */
  copyFieldsFrom(source: Package, fields: Array<keyof PackageJson> = []) {
    for (const field of fields) {
      ;(this.pkg[field] as any) = source.pkg[field] as any
    }
  }

  async setBinaryPermissions() {
    await Promise.all(this.binaries.map(([binary]) => chmod(binary, 0o777)))
  }

  async createBinaryStubs() {
    await runInParallel(this.binaries, async ([binary, entrypoint]) => {
      if (!entrypoint) return

      const outDir = dirname(binary)
      if (!existsSync(outDir)) await mkdirp(outDir)
      const absPath = entrypoint.replace(/(\.[jt]s)$/, '')
      await writeFile(
        binary,
        `#!/usr/bin/env node\nconst jiti = require('jiti')()\nmodule.exports = jiti('${absPath}')`
      )
      await this.setBinaryPermissions()
    })
  }

  async createStub(path: string | undefined) {
    if (!path || !this.entrypoint || !this.options.build) return

    const outFile = this.resolvePath(path)
    const outDir = dirname(outFile)
    if (!existsSync(outDir)) await mkdirp(outDir)
    const relativeEntrypoint = relative(outDir, this.entrypoint).replace(
      /(\.[jt]s)$/,
      ''
    )
    await writeFile(outFile, `export * from './${relativeEntrypoint}'`)
  }

  async createStubs() {
    return Promise.all([
      this.createBinaryStubs(),
      this.createStub(this.pkg.main),
      this.createStub(this.pkg.module),
      this.createStub(this.pkg.types),
    ])
  }

  /**
   * Copy files from another package's directory
   */
  async copyFilesFrom(source: Package, files: string[]) {
    for (const file of files || source.pkg.files || []) {
      const src = resolve(source.options.rootDir, file)
      const dst = resolve(this.options.rootDir, file)
      await copy(src, dst)
    }
  }

  /**
   * Sort `package.json` and sort package dependencies alphabetically (if enabled in options)
   */
  autoFix() {
    this.pkg = sortPackageJson(this.pkg)
    if (this.options.sortDependencies) this.sortDependencies()
  }

  /**
   * Sort package depndencies alphabetically by object key
   */
  sortDependencies() {
    if (this.pkg.dependencies) {
      this.pkg.dependencies = sortObjectKeys(this.pkg.dependencies)
    }

    if (this.pkg.devDependencies) {
      this.pkg.devDependencies = sortObjectKeys(this.pkg.devDependencies)
    }
  }

  /**
   * Execute command in the package root directory
   */
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

  private resolveEntrypoint(path = this.pkg.main) {
    if (!path) return undefined

    const basefile = basename(path).split('.').slice(0, -1).join()
    let input!: string
    const filenames = [basefile, `${basefile}/index`, 'index']
      .map(name => [`${name}.ts`, `${name}.js`])
      .reduce((names, arr) => {
        arr.forEach(name => names.push(name))
        return names
      }, [] as string[])
    filenames.some(filename => {
      input = this.resolvePath('src', filename)
      return existsSync(input)
    })
    return input
  }

  /**
   * The main package entrypoint (source)
   */
  get entrypoint() {
    return this.resolveEntrypoint()
  }

  /**
   * An array of built package binary paths and their entrypoints
   * @returns an array of tuples of the binary and its corresponding entrypoint
   */
  get binaries() {
    type Binary = string
    type Entrypoint = string | undefined
    const { bin } = this.pkg
    const files = !bin
      ? []
      : typeof bin === 'string'
      ? [bin]
      : Object.values(bin)

    return Array.from(
      new Set<[Binary, Entrypoint]>(
        files.map(file => [
          this.resolvePath(file),
          this.resolveEntrypoint(file),
        ])
      )
    )
  }

  /**
   * Return the child packages of this workspace (or, if there are no workspaces specified, just this package)
   * @param packageNames If package names are provided, these will serve to limit the packages that are returned
   */
  async getWorkspacePackages(packageNames?: string[]) {
    const dirs = new Set<string>()

    await runInParallel(this.pkg.workspaces || ['.'], async workspace => {
      ;(await glob(workspace)).forEach(dir => dirs.add(dir))
    })

    const packages = await runInParallel(dirs, dir => {
      if (!existsSync(this.resolvePath(dir, 'package.json'))) {
        throw new Error('Not a package directory.')
      }
      const pkg = new Package({
        ...this.options,
        rootDir: this.resolvePath(dir),
      })
      if (packageNames && !packageNames.includes(pkg.pkg.name)) {
        throw new Error('Not a selected package.')
      }
      return pkg
    })

    return packages
      .filter(pkg => pkg.status === 'fulfilled')
      .map(pkg => (pkg as PromiseFulfilledResult<Package>).value)
  }

  get shortCommit() {
    const { stdout } = this.exec('git', 'rev-parse --short HEAD', true)
    return stdout
  }

  get branch() {
    const { stdout } = this.exec('git', 'rev-parse --abbrev-ref HEAD', true)
    return stdout
  }
}

export * from './types'
