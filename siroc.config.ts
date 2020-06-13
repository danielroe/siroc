import { Package, PackageOptions } from 'siroc'

const config: PackageOptions = {
  hooks: {
    'build:done'(pkg) {
      const source = new Package({ rootDir: __dirname })
      pkg.copyFilesFrom(source, ['README.md'])
    },
  },
}
export default config
