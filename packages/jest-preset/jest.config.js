// eslint-disable-next-line
const { join } = require('path')

let jestConfig = {}
const jestConfigPath = join(process.cwd(), 'jest.config.js')

try {
  // eslint-disable-next-line
  jestConfig = require(jestConfigPath)
  // eslint-disable-next-line
} catch {}

module.exports = {
  rootDir: process.cwd(),
  preset: '@siroc/jest-preset',
  verbose: true,
  testEnvironment: 'node',
  collectCoverage: true,
  ...jestConfig,
}
