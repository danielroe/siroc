import path from 'path'
import { readJSONSync } from 'fs-extra'

import aliasPlugin from '@rollup/plugin-alias'
import commonjsPlugin from '@rollup/plugin-commonjs'
import jsonPlugin from '@rollup/plugin-json'
import replacePlugin, { Replacement } from '@rollup/plugin-replace'
import nodeResolvePlugin, {
  RollupNodeResolveOptions,
} from '@rollup/plugin-node-resolve'

import licensePlugin from 'rollup-plugin-license'
import defu from 'defu'

import type { OutputOptions, RollupOptions } from 'rollup'

import type { RequireProperties } from '../utils'
import { builtins } from './node-builtins'
import type { PackageJson } from './package-json'

export interface NuxtRollupOptions {
  rootDir?: string
  replace?: Record<string, Replacement>
  alias?: { [find: string]: string }
  externals?: (string | RegExp)[]
  resolve?: RollupNodeResolveOptions
  input?: string
}

export type NuxtRollupConfig = Omit<RollupOptions, 'output'> & {
  output: OutputOptions
}

export function rollupConfig(
  {
    rootDir = process.cwd(),
    plugins = [],
    input = 'src/index.js',
    replace = {},
    alias = {},
    externals = [],
    resolve = {
      resolveOnly: [/lodash/, /^((?!node_modules).)*$/],
    },
    ...options
  }: RollupOptions & NuxtRollupOptions,
  pkg: RequireProperties<PackageJson, 'name'>
): NuxtRollupConfig {
  if (!pkg) {
    pkg = readJSONSync(path.resolve(rootDir, 'package.json'))
  }

  const name = path.basename(pkg.name.replace('-edge', ''))

  return defu({}, options, {
    input: path.resolve(rootDir, input),
    output: {
      dir: path.resolve(rootDir, 'dist'),
      entryFileNames: `${name}.js`,
      chunkFileNames: `${name}-[name].js`,
      format: 'cjs',
      preferConst: true,
    },
    external: [
      // Dependencies that will be installed alongise with the nuxt package
      ...Object.keys(pkg.dependencies || {}),
      // Builtin node modules
      ...builtins,
      // Explicit externals
      ...externals,
    ],
    plugins: [
      aliasPlugin({
        entries: alias,
      }),
      replacePlugin({
        exclude: 'node_modules/**',
        delimiters: ['', ''],
        values: {
          __NODE_ENV__: process.env.NODE_ENV || '',
          ...replace,
        },
      }),
      nodeResolvePlugin(resolve),
      commonjsPlugin({ include: /node_modules/ }),
      jsonPlugin(),
      licensePlugin({
        banner: [
          '/*!',
          ` * ${pkg.name} v${pkg.version} (c) 2016-${new Date().getFullYear()}`,
          `${(pkg.contributors || [])
            .map(c => typeof c !== 'string' && ` * - ${c.name}`)
            .join('\n')}`,
          ' * - All the amazing contributors',
          ' * Released under the MIT License.',
          ' * Website: https://nuxtjs.org',
          '*/',
        ].join('\n'),
      }),
    ].concat(plugins),
  })
}
