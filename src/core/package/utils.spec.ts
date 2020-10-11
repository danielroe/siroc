import { getEntrypointFilenames } from './utils'

describe('getEntrypointFilenames()', () => {
  const fixture = [
    [
      './lib/babel.js',
      [
        'babel.ts',
        'babel.js',
        'babel/index.ts',
        'babel/index.js',
        'index.ts',
        'index.js',
      ],
    ],
    [
      './lib/babel.es.js',
      [
        'babel.es.ts',
        'babel.es.js',
        'babel.es/index.ts',
        'babel.es/index.js',
        'babel.ts',
        'babel.js',
        'babel/index.ts',
        'babel/index.js',
        'index.ts',
        'index.js',
      ],
    ],
  ] as const

  it('should return the correct possible filenames', () => {
    fixture.forEach(([name, output]) => {
      expect(getEntrypointFilenames(name)).toEqual(output)
    })
  })
})
