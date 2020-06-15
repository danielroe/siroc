// eslint-disable-next-line
const { join } = require('path')

let eslintConfig = {}
const eslintConfigPath = join(process.cwd(), '.eslintrc.js')

try {
  eslintConfig = require(eslintConfigPath)
  // eslint-disable-next-line
} catch {}

module.exports = eslintConfig || {
  extends: '@siroc',
}
