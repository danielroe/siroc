import { resolve } from 'path'

import { existsSync, remove, readFileSync } from 'fs-extra'
import { RollupBuild } from 'rollup'

import { Package, PackageOptions } from '.'

const loadPackage = (options?: PackageOptions) =>
  new Package({ rootDir: __dirname, ...options })

describe('package class', () => {
  let core: Package
  let cli: Package
  let siroc: Package

  beforeEach(() => {
    core = loadPackage()
    cli = core.load('../cli')
    siroc = core.load('../siroc')
  })

  test('should read JSON', () => {
    expect(core.pkg.name).toBe('@siroc/core')
    expect(siroc.pkg.name).toBe('siroc')
  })

  test('should generate appropriate binary array', () => {
    expect(cli.binaries.length).toBe(2)
  })

  test('should generate a package version', () => {
    const { version } = core.pkg
    const newVersion = core.version
    expect(version === newVersion).toBeFalsy()
    expect(newVersion.includes(version)).toBeTruthy()
    core.suffixAndVersion()
    const { version: newestVersion } = core.pkg
    expect(newestVersion).toBe(newVersion)
  })

  test('should suffix package', () => {
    // TODO: more testing required here
    const core = loadPackage({ suffix: '-test' })
    expect(core.pkg.name).toBe('@siroc/core')
    core.suffixAndVersion()
    expect(core.pkg.name).toBe('@siroc/core-test')
  })

  test('should get git commit and branch', () => {
    const { shortCommit, branch } = core
    expect(typeof shortCommit).toBe('string')
    expect(typeof branch).toBe('string')
  })

  test('should generate package stub', async () => {
    const files = [
      resolve(__dirname, '../../dist/index.js'),
      resolve(__dirname, '../../dist/index.es.js'),
      resolve(__dirname, '../../dist/index.d.ts'),
    ]
    for (const file of files) {
      await remove(file)
      expect(existsSync(file)).toBeFalsy()
    }

    await core.createStubs()

    for (const file of files) {
      expect(readFileSync(file).toString()).toBe(
        `export * from './../src/index'`
      )
    }
  })

  test('should create binary stub', async () => {
    const file = resolve(__dirname, '../../../cli/bin/cli.js')

    await remove(file)
    expect(existsSync(file)).toBeFalsy()
    await cli.createStubs()
    expect(readFileSync(file).toString()).toBe(
      `#!/usr/bin/env node\nconst jiti = require('jiti')(__filename)\nmodule.exports = jiti('./../src/index')`
    )
  })
})

describe('package hooks', () => {
  test('should not error if no hooks are provided', async () => {
    const core = loadPackage()
    let errored
    try {
      await core.callHook('build:done', { bundle: {} as RollupBuild })
    } catch {
      errored = true
    }
    expect(errored).toBeFalsy()
  })

  test('should call hooks when provided', () => {
    let called = false
    const bundle = {} as RollupBuild
    const hookPkg = loadPackage({
      hooks: {
        'build:done'(pkg, { bundle: providedBundle }) {
          expect(pkg).toBe(hookPkg)
          expect(providedBundle).toBe(bundle)
          called = true
        },
      },
    })
    expect(called).toBeFalsy()
    hookPkg.callHook('build:done', { bundle })
    expect(called).toBeTruthy()
  })

  test('should call multiple hooks', async () => {
    let called = 0
    const hookPkg = loadPackage({
      hooks: {
        'build:done': [
          async () => {
            called = called + 1
          },
          () => {
            throw new Error('did not work')
          },
          async () => {
            called = called + 2
          },
        ],
      },
    })
    expect(called).toBe(0)
    await hookPkg.callHook('build:done', { bundle: {} as RollupBuild })
    expect(called).toBe(3)
  })
})
