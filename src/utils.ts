import _esm from 'esm'
const esm = _esm(module)

export const sortObjectKeys = <T>(obj: Record<string, T>) =>
  Object.fromEntries(
    Object.entries(obj).sort(([key1], [key2]) => +key2 - +key1)
  )

export const tryRequire = <T = unknown>(id: string) => {
  try {
    const contents = esm<T | { default: T }>(id)
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
