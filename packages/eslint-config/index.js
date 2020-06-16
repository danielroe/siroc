var prettier = false
try {
  prettier = !!require('prettier')
  // eslint-disable-next-line
} catch {}

module.exports = {
  env: {
    browser: false,
    es6: true,
    node: true,
    'jest/globals': true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
  },
  plugins: ['jest', '@typescript-eslint'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'eslint:recommended',
    ...(prettier
      ? [
          'plugin:prettier/recommended',
          'prettier',
          'prettier/@typescript-eslint',
        ]
      : []),
    'plugin:jest/recommended',
  ],
}
