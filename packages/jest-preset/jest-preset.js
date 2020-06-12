module.exports = {
  coveragePathIgnorePatterns: [
    '[\\/]dist[\\/]',
    '.*\\.spec.ts',
    '.babelrc.js',
    '.*\\.config.js',
  ],
  transform: {
    '\\.ts': [
      'babel-jest',
      {
        presets: ['@babel/preset-env', '@babel/preset-typescript'],
        plugins: ['@babel/plugin-transform-runtime'],
      },
    ],
  },
}
