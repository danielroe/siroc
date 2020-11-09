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
import esbuild, { Options as EsbuildOptions } from 'rollup-plugin-esbuild'

import { Package } from '../package'
import { includeDefinedProperties, includeIf } from '../utils'
import { builtins } from './builtins'
import { convertToUMDName, getNameFunction } from './utils'

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
  esbuildOptions?: EsbuildOptions
}

export function getRollupConfig(
  {
    input,
    replace = {},
    alias = {},
    externals = [],
    dev = false,
    resolve: resolveOptions = {
      resolveOnly: [/^((?!node_modules).)*$/],
      preferBuiltins: true,
    },
    plugins = [],
    esbuildOptions,
    ...options
  }: BuildConfigOptions,
  pkg: Package = new Package()
): RollupOptions[] {
  const {
    binaries,
    entrypoint,
    exports,
    pkg: pkgConfig,
    options: { rootDir, suffix },
  } = pkg
  const resolvePath = (...path: string[]) => resolve(rootDir, ...path)
  input = input ? resolvePath(input) : entrypoint
  if (!input && !binaries.length && !exports.length) return []

  const name = basename(pkgConfig.name.replace(suffix, ''))
  const getFilenames = getNameFunction(rootDir, name)

  const external = [
    // Dependencies that will be installed alongside the package
    ...Object.keys(pkgConfig.dependencies || {}),
    ...Object.keys(pkgConfig.optionalDependencies || {}),
    ...Object.keys(pkgConfig.peerDependencies || {}),
    // Builtin node modules
    ...builtins,
    ...externals,
  ]

  const getDeclarationPlugins = () => [
    jsonPlugin(),
    dts({
      compilerOptions: {
        allowJs: true,
      },
    }),
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
        target: 'es2018',
        ...esbuildOptions,
      }),
      jsonPlugin(),
    ].concat(plugins)

  const defaultOutputs: OutputOptions[] = [
    {
      ...getFilenames(pkgConfig.main),
      preferConst: true,
      exports: 'auto',
    },
    ...includeIf(
      !dev && pkgConfig.module,
      (pkgModule): OutputOptions => ({
        ...getFilenames(pkgModule, '.es', 'es'),
        exports: 'auto',
      })
    ),
    ...includeIf(
      !dev && pkgConfig.browser,
      (pkgBrowser): OutputOptions => ({
        ...getFilenames(pkgBrowser, '.umd', 'umd'),
        name: convertToUMDName(pkgConfig.name),
        exports: 'auto',
      })
    ),
  ]

  return [
    ...binaries.map(([binary, input]) => {
      return defu({}, options as RollupOptions, {
        input,
        output: {
          ...getFilenames(binary, '', 'cjs'),
          preferConst: true,
          exports: 'auto',
          banner: '#!/usr/bin/env node\n',
        } as OutputOptions,
        external,
        plugins: getPlugins(),
      })
    }),
    ...includeIf(input, input =>
      defu({}, options as RollupOptions, {
        input,
        output: defaultOutputs,
        external,
        plugins: getPlugins(),
      })
    ),
    ...includeIf(pkgConfig.types && input, input => ({
      input,
      output: {
        // eslint-disable-next-line
        file: resolvePath(pkgConfig.types!),
        format: 'es',
        exports: 'auto',
      } as OutputOptions,
      external,
      plugins: getDeclarationPlugins(),
    })),
    ...exports.map(outfile =>
      defu({}, options as RollupOptions, {
        input: pkg.resolveEntrypoint(outfile),
        output: {
          ...getFilenames(outfile),
          preferConst: true,
          exports: 'auto',
        } as OutputOptions,
        external,
        plugins: getPlugins(),
      })
    ),
    ...exports.map(outfile =>
      defu({}, options as RollupOptions, {
        input: pkg.resolveEntrypoint(outfile),
        output: {
          file: resolvePath(outfile.replace('.js', '.d.ts')),
          format: 'es',
          exports: 'auto',
        } as OutputOptions,
        external,
        plugins: getDeclarationPlugins(),
      })
    ),
  ]
}
