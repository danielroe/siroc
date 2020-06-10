// @ts-check

import { Package } from 'siroc'

const source = new Package({ rootDir: __dirname })

/**
 * @type {import('@siroc/core').PackageOptions} config
 */
const config = {
  hooks: {
    'build:done'(pkg) {
      pkg.copyFilesFrom(source, ['README.md'])
    },
  },
}
export default config
