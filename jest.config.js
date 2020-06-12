module.exports = {
  preset: './packages/jest-preset',
  projects: ['<rootDir>/packages/*'],
  verbose: true,
  testEnvironment: 'node',
  collectCoverage: true,
}
