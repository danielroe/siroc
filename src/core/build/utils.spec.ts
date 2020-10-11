import { convertToUMDName, formatForName } from './utils'

describe('formatForName()', () => {
  const fixture = [
    [['index.js'], 'cjs'],
    [['index.es.js'], 'es'],
    [['index.umd.js'], 'umd'],
    [['index.js', 'es'], 'es'],
    [['index.browser.js'], 'cjs'],
  ] as const

  it('should return the correct format', () => {
    fixture.forEach(([[filename, ...options], output]) => {
      expect(formatForName(filename, ...options)).toEqual(output)
    })
  })
})

describe('convertToUMDName()', () => {
  const fixture = [
    ['@vue/composition-api', 'CompositionApi'],
    ['sanity-typed-queries', 'SanityTypedQueries'],
    ['siroc', 'Siroc'],
  ] as const

  it('should return the correct names', () => {
    fixture.forEach(([input, output]) => {
      expect(convertToUMDName(input)).toEqual(output)
    })
  })
})
