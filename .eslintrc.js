module.exports = {
  root: true,
  rules: {
    'prettier/prettier': [1, require('./prettier.config.js')],
    '@typescript-eslint/no-inferrable-types': 1,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    'jest/valid-describe': 0,
    'no-dupe-class-members': 0,
  },
  extends: ['plugin:promise/recommended', '@siroc'],
}
