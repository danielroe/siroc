export function loadAllSettled() {
  ;(Promise.allSettled as any) = function <T>(
    values: Iterable<T>
  ): Promise<PromiseSettledResult<T extends PromiseLike<infer U> ? U : T>[]> {
    return Promise.all(
      Array(values).map(promise => {
        if (promise instanceof Promise) {
          return promise
            .then(value => ({
              status: 'fulfilled' as const,
              value,
            }))
            .catch(reason => ({
              status: 'rejected' as const,
              reason,
            }))
        }
        return {
          status: 'fulfilled' as const,
          value: promise,
        }
      })
    )
  }
}

export function loadFromEntries() {
  Object.fromEntries = function <T = any>(
    entries: Iterable<readonly [PropertyKey, T]>
  ): { [k: string]: T } {
    const newObject: Record<string, T> = {}
    for (const [key, value] of entries) {
      if (typeof key === 'string') newObject[key] = value
    }
    return newObject
  }
}
