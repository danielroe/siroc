import { getEntrypointFilenames } from './utils'

describe('getEntrypointFilenames()', () => {
  const fixture = [
    [
      './lib/babel.js',
      [
        'lib/babel.ts',
        'lib/babel.js',
        'lib/babel/index.ts',
        'lib/babel/index.js',
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
        'lib/babel.es.ts',
        'lib/babel.es.js',
        'lib/babel.es/index.ts',
        'lib/babel.es/index.js',
        'lib/babel.ts',
        'lib/babel.js',
        'lib/babel/index.ts',
        'lib/babel/index.js',
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
    [
      './dist/components/other.umd.js',
      [
        'dist/components/other.umd.ts',
        'dist/components/other.umd.js',
        'dist/components/other.umd/index.ts',
        'dist/components/other.umd/index.js',
        'dist/components/other.ts',
        'dist/components/other.js',
        'dist/components/other/index.ts',
        'dist/components/other/index.js',
        'components/other.umd.ts',
        'components/other.umd.js',
        'components/other.umd/index.ts',
        'components/other.umd/index.js',
        'components/other.ts',
        'components/other.js',
        'components/other/index.ts',
        'components/other/index.js',
        'other.umd.ts',
        'other.umd.js',
        'other.umd/index.ts',
        'other.umd/index.js',
        'other.ts',
        'other.js',
        'other/index.ts',
        'other/index.js',
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
