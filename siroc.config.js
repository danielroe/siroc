// @ts-check

import { copy } from 'fs-extra'
import { resolve } from 'path'

/**
 * @type {import('@siroc/core').PackageOptions} config
 */
const config = {
  hooks: {
    'build:done'(pkg) {
      const readme = resolve(__dirname, 'README.md')
      const destination = resolve(pkg.options.rootDir, 'README.md')

      copy(readme, destination)
    },
  },
}
export default config
