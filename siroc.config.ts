import { Package, PackageOptions } from 'siroc'

const config: PackageOptions = {
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
}
export default config
