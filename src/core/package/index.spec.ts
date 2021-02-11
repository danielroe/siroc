import { resolve } from 'upath'

import { existsSync, remove, readFileSync } from 'fs-extra'
import { RollupBuild } from 'rollup'

import { Package, SirocOptions } from '.'

const getFixturePath = (path: string) =>
  resolve(__dirname, '../../../test/fixture', path)

const loadPackage = (options?: SirocOptions) =>
  new Package({
    rootDir: getFixturePath('default'),
    ...options,
  })

describe('package class', () => {
  let core: Package
  let cli: Package

  beforeEach(() => {
    core = loadPackage()
    cli = core.load('../cli')
  })

  test('should read JSON', () => {
    expect(core.pkg.name).toBe('default')
    expect(cli.pkg.name).toBe('cli')
  })

  test('should generate appropriate binary array', () => {
    expect(cli.binaries.length).toBe(1)
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
    expect(core.pkg.name).toBe('default')
    core.suffixAndVersion()
    expect(core.pkg.name).toBe('default-test')
  })

  test('should get git commit and branch', () => {
    const { shortCommit, branch } = core
    expect(typeof shortCommit).toBe('string')
    expect(typeof branch).toBe('string')
  })

  // TODO: move to fixture
  test('should generate package stub', async () => {
    const defaultPath = getFixturePath('default')
    const files = [
      resolve(defaultPath, 'dist/index.js'),
      resolve(defaultPath, 'dist/index.es.js'),
      resolve(defaultPath, 'dist/index.d.ts'),
    ]
    for (const file of files) {
      await remove(file)
      expect(existsSync(file)).toBeFalsy()
    }

    await core.createStubs()

    for (const file of files) {
      expect(
        readFileSync(file)
          .toString()
          .replace(/from '.*\/fixture/, "from '/fixture")
      ).toBe(`export * from './../src/index'`)
    }
  })

  // TODO: move to fixture
  test('should create binary stub', async () => {
    const file = resolve(getFixturePath('cli'), 'bin/cli.js')

    await remove(file)
    expect(existsSync(file)).toBeFalsy()
    await cli.createStubs()
    expect(
      readFileSync(file)
        .toString()
        .replace(/jiti\('.*\/fixture/, "jiti('/fixture")
    ).toBe(
      `#!/usr/bin/env node\nconst jiti = require('jiti')()\nmodule.exports = jiti('/fixture/cli/src/index')`
    )
  })

  test('should handle git data', () => {
    const { lastGitTag } = core
    expect(lastGitTag[0]).toBe('v')
  })

  test('should parse contributors', () => {
    const result = [
      core.parsePerson('Barney Rubble (http://barnyrubble.tumblr.com/)'),
      core.parsePerson(
        'Barney Rubble <b@rubble.com> (http://barnyrubble.tumblr.com/)'
      ),
    ]
    expect(result).toEqual([
      {
        name: 'Barney Rubble',
        url: 'http://barnyrubble.tumblr.com/',
      },
      {
        name: 'Barney Rubble',
        email: 'b@rubble.com',
        url: 'http://barnyrubble.tumblr.com/',
      },
    ])
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
