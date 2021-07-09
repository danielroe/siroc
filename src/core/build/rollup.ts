import { resolve, basename, relative } from 'upath'

import aliasPlugin from '@rollup/plugin-alias'
import commonjsPlugin from '@rollup/plugin-commonjs'
import jsonPlugin from '@rollup/plugin-json'
import replacePlugin, { Replacement } from '@rollup/plugin-replace'
import nodeResolvePlugin, {
  RollupNodeResolveOptions,
} from '@rollup/plugin-node-resolve'
import chalk from 'chalk'
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

export interface BuildOverride {
  input: string
  output: string
  format: OutputOptions['format']
}

export function regexpForPackage(name: string) {
  // Should match `@foo/bar/index.js`, `node_modules\@foo\bar`,
  // `node_modules/@foo/bar` as well as `@foo/bar`.
  name = name.replace(/[\\/]/g, '[\\\\/]')
  return new RegExp(`(^|node_modules[\\\\/])${name}([\\\\/]|$)`, 'i')
}

function regexpForPackages(packages?: Record<string, string>) {
  return Object.keys(packages || {}).map(regexpForPackage)
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
  pkg: Package = new Package(),
  override?: BuildOverride
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
    ...regexpForPackages(pkgConfig.dependencies),
    ...regexpForPackages(pkgConfig.optionalDependencies),
    ...regexpForPackages(pkgConfig.peerDependencies),
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

  const getPlugins = () => [
    aliasPlugin({
      entries: alias,
    }),
    replacePlugin({
      exclude: 'node_modules/**',
      preventAssignment: true,
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
    ...plugins,
  ]

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

  if (override) {
    return [
      {
        input: override.input,
        output: {
          ...getFilenames(override.output, override.format),
          ...(override.format === 'umd'
            ? { name: convertToUMDName(pkgConfig.name) }
            : {}),
          preferConst: true,
          exports: 'auto',
          format: override.format,
        } as OutputOptions,
        external,
        plugins: getPlugins(),
      },
    ]
  }

  const typeEntrypoint =
    (pkgConfig.types || pkgConfig.typings) &&
    pkg.resolveEntrypoint(pkgConfig.types || pkgConfig.typings)

  return [
    ...binaries.map(([binary, input]) =>
      defu({}, options as RollupOptions, {
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
    ),
    ...includeIf(input, input =>
      defu({}, options as RollupOptions, {
        input,
        output: defaultOutputs,
        external,
        plugins: getPlugins(),
      })
    ),
    ...includeIf(typeEntrypoint, input => ({
      input,
      output: {
        // eslint-disable-next-line
        file: resolvePath(pkgConfig.types || pkgConfig.typings!),
        format: 'es',
        exports: 'auto',
      } as OutputOptions,
      external,
      plugins: getDeclarationPlugins(),
    })),
    ...exports
      .filter(outfile => outfile && !outfile.match(/\.json$/))
      .map(outfile =>
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
    ...exports
      .filter(
        outfile =>
          outfile &&
          !outfile.match(/\.json$/) &&
          pkg.resolveEntrypoint(outfile) !== typeEntrypoint
      )
      .map(outfile =>
        defu({}, options as RollupOptions, {
          input: pkg.resolveEntrypoint(outfile),
          output: {
            file: resolvePath(outfile.replace(/(\.es)?\.js$/, '.d.ts')),
            format: 'es',
            exports: 'auto',
          } as OutputOptions,
          external,
          plugins: getDeclarationPlugins(),
        })
      ),
  ]
}

function hl(str: string) {
  return chalk.green(str)
}

function prettyPath(p: string, highlight = true) {
  p = relative(process.cwd(), p)
  return highlight ? hl(p) : p
}

export const logRollupConfig = (pkg: Package, config: RollupOptions[]) => {
  config.forEach(item => {
    const input =
      typeof item.input === 'string'
        ? prettyPath(item.input, false).padEnd(30) + ' → '
        : item.input
    const output = Array.isArray(item.output) ? item.output : [item.output]
    output.forEach(out => {
      const outfile =
        out?.file ||
        (out?.dir ? out.dir + '/' : '') + String(out?.entryFileNames) ||
        ''
      const format = outfile.endsWith('.d.ts')
        ? '(dts)'
        : out?.format
        ? `(${out.format})`
        : ''
      pkg.logger.debug(input, prettyPath(outfile), format)
    })
  })
}
