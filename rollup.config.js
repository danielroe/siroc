import jsonPlugin from '@rollup/plugin-json'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

import cli from './packages/cli/package.json'
import core from './packages/core/package.json'

export default [
  {
    input: 'packages/cli/src/index.ts',
    output: {
      file: 'packages/cli/bin/cli.js',
      format: 'cjs',
      banner: '#!/usr/bin/env node\n',
    },
    external: Object.keys(cli.dependencies || {}),
    plugins: [
      jsonPlugin(),
      esbuild({
        watch: process.argv.includes('--watch'),
        target: 'es2018',
      }),
    ],
  },
  {
    input: 'packages/core/src/index.ts',
    output: {
      file: 'packages/core/dist/index.js',
      format: 'cjs',
    },
    external: [...Object.keys(core.dependencies || {})],
    plugins: [
      esbuild({
        watch: process.argv.includes('--watch'),
        target: 'es2018',
      }),
    ],
  },
  {
    input: 'packages/core/src/index.ts',
    output: [{ file: 'packages/core/dist/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
]
