import { defineSirocConfig, Package } from 'siroc'

export default defineSirocConfig({
  rollup: {
    replace: {
      'process.env.TIME': 'false',
    },
  },
  hooks: {
    'build:done'(pkg) {
      const source = new Package({ rootDir: __dirname })
      pkg.copyFilesFrom(source, ['README.md'])
    },
  },
})
