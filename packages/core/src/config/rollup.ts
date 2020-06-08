import { resolve as _resolve, basename } from 'path'

import aliasPlugin from '@rollup/plugin-alias'
import commonjsPlugin from '@rollup/plugin-commonjs'
import jsonPlugin from '@rollup/plugin-json'
import replacePlugin, { Replacement } from '@rollup/plugin-replace'
import nodeResolvePlugin, {
  RollupNodeResolveOptions,
} from '@rollup/plugin-node-resolve'
import defu from 'defu'
import { readJSONSync, existsSync } from 'fs-extra'
import type { RollupOptions } from 'rollup'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

import {
  RequireProperties,
  includeDefinedProperties,
  includeIf,
} from '../utils'
import { builtins } from './node-builtins'
import type { PackageJson } from './package-json'
import { getNameFunction } from './utils'

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
    input,
    replace = {},
    alias = {},
    externals = [],
    dev = false,
    resolve: resolveOptions = {
      resolveOnly: [/lodash/, /^((?!node_modules).)*$/],
      preferBuiltins: true,
    },
    plugins = [],
    ...options
  }: BuildConfigOptions,
  pkg: RequireProperties<PackageJson, 'name'>
): RollupOptions[] {
  const resolve = (...path: string[]) => _resolve(rootDir, ...path)

  if (!pkg) pkg = readJSONSync(resolve('package.json'))

  const name = basename(pkg.name.replace('-edge', ''))
  const getFilenames = getNameFunction(rootDir, name)

  const external = [
    // Dependencies that will be installed alongside the package
    ...Object.keys(pkg.dependencies || {}),
    // Builtin node modules
    ...builtins,
    ...externals,
  ]

  const getPlugins = () =>
    [
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
    ].concat(plugins)

  function getEntrypoint(path?: string) {
    if (!path) return undefined
    const basefile = basename(path).split('.').slice(0, -1).join()
    let input!: string
    const filenames = [basefile, `${basefile}/index`, 'index']
      .map(name => [`${name}.ts`, `${name}.js`])
      .flat()
    filenames.some(filename => {
      input = resolve('src', filename)
      return existsSync(input)
    })
    return input
  }

  input = input ? resolve(input) : getEntrypoint(pkg.main)

  const binaries = pkg.bin
    ? typeof pkg.bin === 'string'
      ? [pkg.bin]
      : Object.values(pkg.bin)
    : []

  if (!input && !binaries.length) return []

  const defaultOutputs = [
    {
      ...getFilenames(pkg.main),
      format: 'cjs',
      preferConst: true,
    },
    ...includeIf(pkg.module && !dev, {
      ...getFilenames(pkg.module, '-es'),
      format: 'es',
    }),
  ]

  return [
    ...binaries.map(path => {
      return defu({}, options, {
        input: getEntrypoint(path),
        output: {
          ...getFilenames(path),
          format: 'cjs',
          preferConst: true,
          banner: '#!/usr/bin/env node\n',
        },
        external,
        plugins: getPlugins(),
      })
    }),
    ...includeIf(
      input,
      defu({}, options, {
        input,
        output: defaultOutputs,
        external,
        plugins: getPlugins(),
      })
    ),
    ...includeIf(pkg.types && input, {
      input,
      output: {
        file: resolve(pkg.types || ''),
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
