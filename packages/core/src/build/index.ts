import { dirname } from 'path'

import { bold, gray } from 'chalk'
import consola from 'consola'
import { remove } from 'fs-extra'
import { rollup, watch, RollupError, RollupOptions } from 'rollup'

import type { BuildOptions, Package } from '../package'
import { asArray, runInParallel, RequireProperties } from '../utils'
import { BuildConfigOptions, getRollupConfig } from './rollup'

export * from './hooks'
export * from './rollup'

/**
 * Remove folders for build destinations
 */
async function removeBuildFolders(config: RollupOptions[]) {
  const directories = new Set<string>()
  config.forEach(conf => {
    asArray(conf.output).forEach(conf => {
      if (!conf) return
      const dir = conf.dir || dirname(conf.file || '')
      if (!dir.includes('src')) directories.add(dir)
    })
  })
  for (const dir of directories) {
    await remove(dir)
  }
}

export const build = async (
  pkg: Package,
  { watch: _watch = false, dev = _watch }: BuildOptions = {}
) => {
  // Prepare rollup config
  const config: RequireProperties<BuildConfigOptions, 'alias' | 'replace'> = {
    alias: {},
    replace: {},
    dev,
    shouldWatch: _watch,
    ...pkg.options.rollup,
  }

  // Replace linkedDependencies with their suffixed version
  if (pkg.options.suffix && pkg.options.suffix.length) {
    for (const _name of pkg.options.linkedDependencies || []) {
      const name = _name + pkg.options.suffix
      config.replace[`'${_name}'`] = `'${name}'`
      config.alias[_name] = name
    }
  }

  // Allow extending config
  await pkg.callHook('build:extend', { config })

  // Create rollup config
  const _rollupConfig = getRollupConfig(config, pkg)

  // Allow extending rollup config
  await pkg.callHook('build:extendRollup', {
    rollupConfig: _rollupConfig,
  })

  await removeBuildFolders(_rollupConfig)

  if (_watch) {
    // Watch
    const watcher = watch(_rollupConfig)
    watcher.on('event', event => {
      switch (event.code) {
        // The watcher is (re)starting
        case 'START':
          return pkg.logger.debug(`Watching ${pkg.pkg.name} for changes`)

        // Building an individual bundle
        case 'BUNDLE_START':
          return pkg.logger.debug(`Building ${pkg.pkg.name}`)

        // Finished building a bundle
        case 'BUNDLE_END':
          return

        // Finished building all bundles
        case 'END':
          return pkg.logger.success(`Built ${bold(pkg.pkg.name)}`)

        // Encountered an error while bundling
        case 'ERROR':
          formatError(pkg, event.error)
          return pkg.logger.error(event.error)

        // Unknown event
        default:
          // If rollup adds more events, TypeScript will let us know
          // eslint-disable-next-line
          const _event: never = event
          return pkg.logger.info(JSON.stringify(_event))
      }
    })
  } else {
    // Build
    pkg.logger.debug(`Building ${pkg.pkg.name}`)
    await runInParallel(_rollupConfig, async config => {
      try {
        const bundle = await rollup(config)
        await runInParallel(asArray(config.output), async outputConfig => {
          if (!outputConfig) {
            consola.error('No build defined in generated config.')
            return
          }

          const { output } = await bundle.write(outputConfig)

          pkg.logger.success(
            `Built ${bold(pkg.pkg.name)} ${gray(output[0].fileName)}`
          )
        })
        await pkg.callHook('build:done', { bundle })
      } catch (err) {
        const formattedError = formatError(pkg, err)
        pkg.logger.error(formattedError)
        throw formattedError
      }
    })
  }
}

/**
 * Format rollup error
 */
const formatError = (pkg: Package, error: RollupError) => {
  let loc = pkg.options.rootDir
  if (error.loc) {
    const { file, column, line } = error.loc
    loc = `${file}:${line}:${column}`
  }
  error.message = `[${error.code}] ${error.message}\nat ${loc}`
  return error
}
