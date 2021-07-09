import { resolve } from 'upath'

import { Package } from '../package'
import { builtins, builtinsMap } from './builtins'
import { getRollupConfig, regexpForPackage } from './rollup'
import { getNameFunction } from './utils'

const getFixturePath = (path: string) =>
  resolve(__dirname, '../../../test/fixture', path)

describe('rollupConfig', () => {
  let core: Package
  let cli: Package
  beforeEach(() => {
    core = new Package({ rootDir: getFixturePath('default') })
    cli = new Package({ rootDir: getFixturePath('cli') })
  })
  it('should return an appropriate config', () => {
    const config = getRollupConfig({}, core)
    expect(Array.isArray(config)).toBeTruthy()
    expect(typeof config[0].input).toBe('string')
    expect(config.length).toBe(2)
  })
  it('should generate builds for binaries', () => {
    const config = getRollupConfig({}, cli)
    expect(config.length).toBe(1)
  })
  it('should return an empty config if there are no outputs', () => {
    const empty = new Package({ rootDir: getFixturePath('empty') })
    const config = getRollupConfig({}, empty)
    expect(config).toEqual([])
  })
  it('should return a config for the current directory if no package is provided', () => {
    const config = getRollupConfig({ input: 'src/index.ts' })
    expect(Array.isArray(config)).toBeTruthy()
    expect(typeof config[0].input).toBe('string')
  })
  const base = getFixturePath('default')
  it('should generate appropriately named outputs', () => {
    const fn = getNameFunction(core.options.rootDir, 'pkg')
    const result = fn('customdist/fname')
    expect(
      JSON.parse(JSON.stringify(result).replace(RegExp(base, 'g'), ''))
    ).toMatchSnapshot()
  })
  it('should generate outputs without defined paths', () => {
    const fn = getNameFunction(core.options.rootDir, 'pkg')
    const result = fn(undefined)
    expect(
      JSON.parse(JSON.stringify(result).replace(RegExp(base, 'g'), ''))
    ).toMatchSnapshot()
    const suffixedResult = fn(undefined, '-suffix')
    expect(
      JSON.parse(JSON.stringify(suffixedResult).replace(RegExp(base, 'g'), ''))
    ).toMatchSnapshot()
  })
})

describe('builtins', () => {
  it('should return an array of builtins', () => {
    expect(Array.isArray(builtins)).toBeTruthy()
    expect(typeof builtins[0]).toBe('string')
  })
  it('should return a builtins map', () => {
    const map = builtinsMap()
    const newMap = builtinsMap()
    expect(map).toBe(newMap)
    expect(Object.values(map)[0]).toBe(true)
  })
})

describe('external matching', () => {
  const pattern = regexpForPackage('@nuxt/utils')

  it('should match package name', () => {
    expect(pattern.test('@nuxt/utils')).toBeTruthy()
  })

  it('should match package subpath', () => {
    expect(pattern.test('@nuxt/utils/subpath')).toBeTruthy()
  })

  it('should match fully resolved package path', () => {
    expect(
      pattern.test('/project/node_modules/@nuxt/utils/index.js')
    ).toBeTruthy()
    expect(
      pattern.test('c:\\project\\node_modules\\@nuxt\\utils\\index.js')
    ).toBeTruthy()
  })

  it('should not match substring paths', () => {
    expect(pattern.test('@nuxt/utils2')).toBeFalsy()
    expect(pattern.test('a@nuxt/utils')).toBeFalsy()
  })
})
