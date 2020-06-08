import jsonPlugin from '@rollup/plugin-json'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

import pkg from './package.json'

export default [
  {
    input: 'src/cli/index.ts',
    output: {
      file: pkg.bin.siroc,
      format: 'cjs',
    },
    external: Object.keys(pkg.dependencies || {}),
    plugins: [
      jsonPlugin(),
      esbuild({
        watch: process.argv.includes('--watch'),
        target: 'es2018',
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      file: pkg.main,
      format: 'cjs',
    },
    external: [...Object.keys(pkg.dependencies || {})],
    plugins: [
      esbuild({
        watch: process.argv.includes('--watch'),
        target: 'es2018',
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: [{ file: pkg.types, format: 'es' }],
    plugins: [dts()],
  },
]
