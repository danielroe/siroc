import { resolve, dirname, basename } from 'path'

import aliasPlugin from '@rollup/plugin-alias'
import commonjsPlugin from '@rollup/plugin-commonjs'
import jsonPlugin from '@rollup/plugin-json'
import replacePlugin, { Replacement } from '@rollup/plugin-replace'
import nodeResolvePlugin, {
  RollupNodeResolveOptions,
} from '@rollup/plugin-node-resolve'
import defu from 'defu'
import { readJSONSync } from 'fs-extra'
import type { RollupOptions } from 'rollup'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import licensePlugin from 'rollup-plugin-license'

import {
  RequireProperties,
  includeDefinedProperties,
  includeIf,
} from '../utils'
import { builtins } from './node-builtins'
import type { PackageJson } from './package-json'

const __NODE_ENV__ = process.env.NODE_ENV

export interface BuildConfigOptions extends RollupOptions {
  rootDir?: string
  replace?: Record<string, Replacement>
  alias?: { [find: string]: string }
  dev?: boolean
  /**
   * Explicit externals
   */
  externals?: (string | RegExp)[]
  resolve?: RollupNodeResolveOptions
  input?: string
}

export function rollupConfig(
  {
    rootDir = process.cwd(),
    plugins = [],
    input = 'src/index.js',
    replace = {},
    alias = {},
    externals = [],
    dev = false,
    resolve: resolveOptions = {
      resolveOnly: [/lodash/, /^((?!node_modules).)*$/],
      preferBuiltins: true,
    },
    ...options
  }: BuildConfigOptions,
  pkg: RequireProperties<PackageJson, 'name'>
): RollupOptions[] {
  if (!pkg) pkg = readJSONSync(resolve(rootDir, 'package.json'))

  const name = basename(pkg.name.replace('-edge', ''))

  const external = [
    // Dependencies that will be installed alongside the package
    ...Object.keys(pkg.dependencies || {}),
    // Builtin node modules
    ...builtins,
    ...externals,
  ]

  const getFilenames = (filename: string | undefined, defaultSuffix = '') => {
    return {
      dir: filename
        ? resolve(rootDir, filename ? dirname(filename) : 'dist')
        : resolve(rootDir, 'dist'),
      entryFileNames: filename
        ? basename(filename)
        : `${name}${defaultSuffix}.js`,
      chunkFileNames: filename
        ? `${basename(filename)}-[name].js`
        : `${name}-[name]${defaultSuffix}.js`,
    } as const
  }

  const baseConfig: RollupOptions = defu({}, options, {
    input: resolve(rootDir, input),
    output: [
      {
        ...getFilenames(pkg.main),
        format: 'cjs',
        preferConst: true,
      },
      ...includeIf(pkg.module && !dev, {
        ...getFilenames(pkg.module, '-es'),
        format: 'es',
      }),
    ],
    external,
    plugins: [
      aliasPlugin({
        entries: alias,
      }),
      replacePlugin({
        exclude: 'node_modules/**',
        delimiters: ['', ''],
        values: {
          ...includeDefinedProperties({ __NODE_ENV__ }),
          ...replace,
        },
      }),
      nodeResolvePlugin(resolveOptions),
      commonjsPlugin({ include: /node_modules/ }),
      esbuild({
        watch: process.argv.includes('--watch'),
        target: 'es2018',
      }),
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

  return [
    baseConfig,
    ...includeIf(pkg.types, {
      input: baseConfig.input,
      output: {
        file: resolve(rootDir, 'dist', 'index.d.ts'),
        format: 'es' as const,
      },
      external,
      plugins: [
        jsonPlugin(),
        dts({
          compilerOptions: {
            allowJs: true,
          },
        }),
      ],
    }),
  ]
}
