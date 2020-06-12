import { extname } from 'path'
import { readJSONSync } from 'fs-extra'
import _glob from 'glob'
import _jiti from 'jiti'

import { loadAllSettled, loadFromEntries } from './polyfills'

const jiti = _jiti()

if (!Object.fromEntries) loadFromEntries()
if (!Promise.allSettled) loadAllSettled()

export const glob = (pattern: string) =>
  new Promise<string[]>((resolve, reject) =>
    _glob(pattern, (err, matches) => {
      if (err) return reject(err)
      resolve(matches)
    })
  )

export const sortObjectKeys = <T>(obj: Record<string, T>) =>
  Object.fromEntries(
    Object.entries(obj).sort(([key1], [key2]) => +key2 - +key1)
  )

export const tryJSON = <T = unknown>(id: string) => {
  try {
    return readJSONSync(id) as T
  } catch {
    return undefined
  }
}

export const tryRequire = <T = unknown>(id: string) => {
  try {
    if (extname(id) === 'json') return tryJSON(id)
    const contents = jiti(id) as T | { default: T }
    if ('default' in contents) return contents.default
    return contents
  } catch {
    return undefined
  }
}

export type RequireProperties<T, R extends keyof T> = Omit<T, R> &
  Required<Pick<T, R>>

export const ensureUnique = <T>(items: T[]) => Array.from(new Set(items))

export const groupBy = <T extends Record<string, any>, K extends keyof T>(
  collection: T[],
  key: K
) => {
  const groups = {} as Record<T[K], T[]>
  collection.forEach(entry => {
    groups[entry[key]] = groups[entry[key]] || []
    groups[entry[key]].push(entry)
  })
  return groups
}

type ExcludeNullable<T extends Record<string, any>> = {
  [P in keyof T]: NonNullable<T[P]>
}

export const includeDefinedProperties = <T extends Record<string, any>>(
  options: T
) =>
  Object.fromEntries(
    // eslint-disable-next-line
    Object.entries(options).filter(([_, value]) => value !== undefined)
  ) as ExcludeNullable<T>

type NonFalsy<T> = T extends null | undefined | false ? never : T

export const includeIf = <T, I>(
  test: T,
  itemFactory: (outcome: NonFalsy<T>) => I
) => (test ? [itemFactory(test as any)] : [])

export const runInParallel = async <T, R extends any>(
  items: Iterable<T>,
  cb: (item: T) => Promise<R> | R
) => {
  if (Array.isArray(items))
    return Promise.allSettled(items.map(async item => cb(item)))

  const promises: Array<Promise<R>> = []
  for (const item of items) {
    promises.push(Promise.resolve(cb(item)))
  }
  return Promise.allSettled(promises)
}

export const asArray = <T>(item: T | T[] | undefined): T[] =>
  item !== undefined ? (Array.isArray(item) ? item : [item]) : []
