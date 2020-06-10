import path from 'path'

import type { PackageJson } from '../package'
import { loadAllSettled, loadFromEntries } from './polyfills'
import {
  asArray,
  ensureUnique,
  glob,
  groupBy,
  includeDefinedProperties,
  includeIf,
  runInParallel,
  sortObjectKeys,
  tryRequire,
} from '.'

describe('asArray', () => {
  it('should return an array if passed an undefined value', () => {
    expect(asArray(undefined)).toEqual([])
    expect((asArray as any)()).toEqual([])
  })
  it('should return an array of a single item', () => {
    expect(asArray(1)).toEqual([1])
  })

  it('should return an array unchanged', () => {
    const array = [1, 2]
    expect(asArray(array)).toBe(array)
  })
})

describe('ensureUnique', () => {
  it('should filter out duplicated items', () => {
    const array = [1, 2, 1, 5, 2]
    const result = ensureUnique(array)
    expect(result).toEqual([1, 2, 5])
  })
})

describe('glob', () => {
  it('should resolve paths with a promise', async () => {
    const result = await glob('READ*')
    expect(result).toEqual(['README.md'])
  })
})

describe('groupBy', () => {
  const array = [
    {
      key: 'key-1',
      item: 'item-1',
    },
    {
      key: 'key-1',
      item: 'item-2',
    },
  ]
  it('should return a grouped object', () => {
    const result = groupBy(array, 'key')
    expect(result).toEqual({
      'key-1': array,
    })
  })
  it('should separate items', () => {
    const result = groupBy(array, 'item')
    expect(result).toEqual({
      'item-1': [array[0]],
      'item-2': [array[1]],
    })
  })
})

const definedPropertiesTest = () => {
  it('should omit undefined properties', () => {
    const obj = {
      val: 3,
      another: false,
      further: undefined,
    }
    const result = includeDefinedProperties(obj)
    expect(result).toEqual({
      val: 3,
      another: false,
    })
  })
}

describe('includeDefinedProperties', definedPropertiesTest)

describe('includeIf', () => {
  it('should return an empty array when falsy', () => {
    const results = [
      includeIf(false, 'test'),
      includeIf(null, 'test'),
      includeIf(undefined, 'test'),
    ]
    expect(results).toEqual([[], [], []])
  })
  it('should return the item in an array when true', () => {
    const result = includeIf(true, 'test')
    expect(result).toEqual(['test'])
  })
})

const runInParallelTest = () => {
  it('should run tasks in parallel', async () => {
    let i = 0
    await runInParallel([1, 2, 3], async num => (i = i + num))
    expect(i).toBe(6)
  })
  it('should not fail if one task does', async () => {
    const result = await runInParallel([1, 2, 3], async num => {
      if (num === 2) throw new Error('')
    })
    expect(result.length).toBe(3)
  })
}

describe('runInParallel', runInParallelTest)

const sortObjectKeysTest = () => {
  const obj = {
    c: '',
    '@a': '',
    Z$: '',
  }
  it('should sort object keys alphabetically', () => {
    const result = sortObjectKeys(obj)
    expect(result).toEqual({
      '@a': '',
      c: '',
      Z$: '',
    })
  })
}
describe('sortObjectKeys', sortObjectKeysTest)

describe('tryRequire', () => {
  it('should not throw an error when passed nonsense', () => {
    const result = tryRequire('require this if you dare')
    expect(result).toBeFalsy()
  })
  it('should resolve JS', () => {
    const result = tryRequire(
      path.resolve(__dirname, '../../../babel.config.js')
    )
    expect(result).toBeDefined()
  })
  it('should resolve JSON', () => {
    const result = tryRequire<PackageJson>(
      path.resolve(__dirname, '../package.json')
    )
    expect(result!.name).toBeDefined()
  })
})

describe('utils with polyfills', () => {
  let fromEntries: any
  let allSettled: any
  beforeAll(() => {
    fromEntries = Object.fromEntries
    allSettled = Promise.allSettled
    loadAllSettled()
    loadFromEntries()
  })
  afterAll(() => {
    Object.fromEntries = fromEntries
    Promise.allSettled = allSettled
  })
  // Object.fromEntries
  definedPropertiesTest()
  it('should not include non-string values', () => {
    const result = Object.fromEntries([
      ['key', 'value'],
      [2, 'value'],
    ])
    expect(result).toEqual({ key: 'value' })
  })
  // Promise.allSettled
  runInParallelTest()
  sortObjectKeysTest()
  it('should return bare value if not a promise', async () => {
    const fn = async () => 'another'
    const result = await Promise.allSettled(['test', fn()])
    expect(result).toEqual([
      { status: 'fulfilled', value: 'test' },
      { status: 'fulfilled', value: 'another' },
    ])
  })
})
