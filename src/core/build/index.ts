import { dirname, join, relative } from 'upath'

import { bold, gray, green } from 'chalk'
import { remove, stat } from 'fs-extra'
import { mkdist } from 'mkdist'
import { rollup, watch, RollupError } from 'rollup'

import type { BuildOptions, Package } from '../package'
import {
  asArray,
  ensureUnique,
  includeIf,
  runInParallel,
  RequireProperties,
} from '../utils'
import { getRollupConfig, BuildConfigOptions, logRollupConfig } from './rollup'

export * from './hooks'
export * from './rollup'

/**
 * Remove folders for build destinations
 */
export async function removeBuildFolders(pkg: Package) {
  const directories = ensureUnique(
    [
      ...pkg.binaries.map(([bin]) => bin),
      ...includeIf(pkg.pkg.main, main => main),
    ]
      .map(file => dirname(file))
      .filter(dir => !dir.includes('src'))
  )

  await runInParallel(directories, dir => remove(dir))
}

export const build = async (
  pkg: Package,
  { watch: shouldWatch = false, dev = shouldWatch, override }: BuildOptions = {}
) => {
  const {
    options: { suffix, linkedDependencies, rootDir, rollup: rollupOptions },
  } = pkg
  // Prepare rollup config
  const config: RequireProperties<BuildConfigOptions, 'alias' | 'replace'> = {
    alias: {},
    replace: {},
    dev,
    ...rollupOptions,
  }

  // Replace linkedDependencies with their suffixed version
  if (suffix) {
    for (const _name of linkedDependencies || []) {
      const name = _name + suffix
      config.replace[`'${_name}'`] = `'${name}'`
      config.alias[_name] = name
    }
  }

  // Allow extending config
  await pkg.callHook('build:extend', { config })

  // Create rollup config
  const rollupConfig = getRollupConfig(config, pkg, override)

  // Allow extending rollup config
  await pkg.callHook('build:extendRollup', {
    rollupConfig,
  })

  logRollupConfig(pkg, rollupConfig)

  await runInParallel(pkg.folderExports, folder => {
    const { 1: distDir = folder } = folder.match(/^(.*[^*/])[*/]*$/) || []
    const sourceFolder = pkg.resolveEntrypointFolder(distDir)
    if (!sourceFolder) return

    const srcDir = relative(pkg.options.rootDir, sourceFolder)
    pkg.logger.info(
      `Transpiling \`./${srcDir}\` to \`${distDir}\` with ${bold('mkdist')}.`
    )
    mkdist({
      srcDir,
      distDir: distDir.slice(2),
      rootDir: pkg.options.rootDir,
    })
  })

  if (shouldWatch) {
    // Watch
    const watcher = watch(rollupConfig)
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
          formatError(rootDir, event.error)
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
    await runInParallel(rollupConfig, async config => {
      try {
        const bundle = await rollup(config)
        await runInParallel(asArray(config.output), async outputConfig => {
          if (!outputConfig) {
            pkg.logger.error('No build defined in generated config.')
            process.exit(1)
          }

          const { output } = await bundle.write(outputConfig)
          const { fileName } = output[0]
          let size
          try {
            const filePath = outputConfig.dir
              ? join(outputConfig.dir, fileName)
              : outputConfig.file || fileName
            const { size: bytes } = await stat(filePath)
            if (bytes > 500) {
              size = green(
                ' ' + bold((bytes / 1024).toFixed(1).padStart(5)) + ' kB'
              )
            } else {
              size = green(' ' + bold(String(bytes).padStart(5)) + '  B')
            }
            // eslint-disable-next-line
          } catch {}
          pkg.logger.success(
            `Built ${bold(pkg.pkg.name.padEnd(15))} ${gray(
              fileName.padStart(15)
            )}${size}`
          )
        })
        await pkg.callHook('build:done', { bundle })
      } catch (err) {
        const formattedError = formatError(rootDir, err)
        throw pkg.logger.error(formattedError)
      }
    })
  }
}

/**
 * Format rollup error
 */
const formatError = (rootDir: string, error: RollupError) => {
  let loc = rootDir
  if (error.loc) {
    const { file, column, line } = error.loc
    loc = `${file}:${line}:${column}`
  }
  error.message = `[${error.code}] ${error.message}\nat ${loc}`
  return error
}
