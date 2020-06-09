module.exports = {
  verbose: true,
  projects: ['<rootDir>/packages/*/jest.config.js'],
  testEnvironment: 'node',
  collectCoverage: true,
  coveragePathIgnorePatterns: ['test', '.babelrc.js'],
}
