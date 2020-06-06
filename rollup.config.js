import jsonPlugin from '@rollup/plugin-json'
import esbuild from 'rollup-plugin-esbuild'
import dts from 'rollup-plugin-dts'

import pkg from './package.json'

export default [
  {
    input: 'src/cli/index.ts',
    output: {
      file: pkg.bin.packager,
      format: 'cjs',
    },
    external: Object.keys(pkg.dependencies || {}),
    plugins: [
      jsonPlugin(),
      esbuild({
        watch: process.argv.includes('--watch'),
        minify: process.env.NODE_ENV === 'production',
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
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ],

    plugins: [
      esbuild({
        watch: process.argv.includes('--watch'),
        minify: process.env.NODE_ENV === 'production',
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
