import { resolve, basename } from 'path'

import aliasPlugin from '@rollup/plugin-alias'
import commonjsPlugin from '@rollup/plugin-commonjs'
import jsonPlugin from '@rollup/plugin-json'
import replacePlugin, { Replacement } from '@rollup/plugin-replace'
import nodeResolvePlugin, {
  RollupNodeResolveOptions,
} from '@rollup/plugin-node-resolve'
import defu from 'defu'
import type { RollupOptions, OutputOptions } from 'rollup'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

import { Package } from '../package'
import { includeDefinedProperties, includeIf } from '../utils'
import { builtins } from './builtins'
import { getNameFunction } from './utils'

const __NODE_ENV__ = process.env.NODE_ENV

export interface BuildConfigOptions extends RollupOptions {
  rootDir?: string
  replace?: Record<string, Replacement>
  alias?: { [find: string]: string }
  dev?: boolean
  shouldWatch?: boolean
  /**
   * Explicit externals
   */
  externals?: (string | RegExp)[]
  resolve?: RollupNodeResolveOptions
  input?: string
}

export function getRollupConfig(
  {
    input,
    replace = {},
    alias = {},
    externals = [],
    dev = false,
    shouldWatch: watch = false,
    resolve: resolveOptions = {
      resolveOnly: [/^((?!node_modules).)*$/],
      preferBuiltins: true,
    },
    plugins = [],
    ...options
  }: BuildConfigOptions,
  {
    binaries,
    entrypoint,
    pkg,
    options: { rootDir, suffix },
  }: Package = new Package()
): RollupOptions[] {
  const resolvePath = (...path: string[]) => resolve(rootDir, ...path)
  input = input ? resolvePath(input) : entrypoint
  if (!input && !binaries.length) return []

  const name = basename(pkg.name.replace(suffix, ''))
  const getFilenames = getNameFunction(rootDir, name)

  const external = [
    // Dependencies that will be installed alongside the package
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.optionalDependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
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
        watch,
        target: 'es2018',
      }),
      jsonPlugin(),
    ].concat(plugins)

  const defaultOutputs: OutputOptions[] = [
    {
      ...getFilenames(pkg.main),
      format: 'cjs',
      preferConst: true,
      exports: 'auto',
    },
    ...includeIf(
      !dev && pkg.module,
      (pkgModule): OutputOptions => ({
        ...getFilenames(pkgModule, '-es'),
        format: 'es',
        exports: 'auto',
      })
    ),
  ]

  return [
    ...binaries.map(([binary, input]) => {
      return defu<RollupOptions>(
        {},
        options as RollupOptions,
        {
          input,
          output: {
            ...getFilenames(binary),
            format: 'cjs',
            preferConst: true,
            exports: 'auto',
            banner: '#!/usr/bin/env node\n',
          },
          external,
          plugins: getPlugins(),
        } as RollupOptions
      )
    }),
    ...includeIf(input, input =>
      defu<RollupOptions>(
        {},
        options as RollupOptions,
        {
          input,
          output: defaultOutputs,
          external,
          plugins: getPlugins(),
        } as RollupOptions
      )
    ),
    ...includeIf(pkg.types && input, input => ({
      input,
      output: {
        file: resolvePath(pkg.types || ''),
        format: 'es' as const,
        exports: 'auto',
      } as RollupOptions,
      external,
      plugins: [
        jsonPlugin(),
        dts({
          compilerOptions: {
            allowJs: true,
          },
        }),
      ],
    })),
  ]
}
