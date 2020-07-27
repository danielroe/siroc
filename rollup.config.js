import jsonPlugin from '@rollup/plugin-json'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

import pkg from './package.json'
const external = Object.keys(pkg.dependencies || {})
const esbuildPlugin = esbuild({
  watch: process.argv.includes('--watch'),
  target: 'es2018',
})

export default [
  {
    input: 'src/cli/index.ts',
    output: {
      file: 'bin/cli.js',
      format: 'cjs',
      banner: '#!/usr/bin/env node\n',
    },
    external,
    plugins: [jsonPlugin(), esbuildPlugin],
  },
  {
    input: 'src/core/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
    },
    external,
    plugins: [esbuildPlugin],
  },
  {
    input: 'src/core/index.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
]
