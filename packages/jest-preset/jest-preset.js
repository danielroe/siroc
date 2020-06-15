module.exports = {
  coveragePathIgnorePatterns: [
    '[\\/]dist[\\/]',
    '.*\\.spec.ts',
    '.*\\.config.js',
    '.babelrc.js',
  ],
  transform: {
    '\\.(js|ts)$': [
      'babel-jest',
      {
        presets: ['@babel/preset-env', '@babel/preset-typescript'],
        plugins: ['@babel/plugin-transform-runtime'],
      },
    ],
  },
}
