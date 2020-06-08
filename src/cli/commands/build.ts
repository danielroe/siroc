import { PerformanceObserver, performance } from 'perf_hooks'

import chalk from 'chalk'
import consola from 'consola'

import { Package, BuildOptions } from '../../package'
import { runInParallel } from '../../utils'

const obs = new PerformanceObserver(items => {
  const { duration, name } = items.getEntries()[0]
  const seconds = (duration / 1000).toFixed(1)
  const time = duration > 1000 ? seconds + 's' : duration + 'ms'
  consola.success(`${name} in ${chalk.bold(time)}`)
})
obs.observe({ entryTypes: ['measure'] })

export async function build(options: BuildOptions = {}) {
  // Read package at current directory
  const rootPackage = new Package()
  const workspacePackages = await rootPackage.getWorkspacePackages()

  const { watch } = options
  consola.info(`Beginning build${watch ? ' (watching)' : ''}`)
  performance.mark('Start build')

  // Universal linkedDependencies based on workspace
  const linkedDependencies = workspacePackages.map(p =>
    p.pkg.name.replace(p.options.suffix, '')
  )

  await runInParallel(workspacePackages, async pkg => {
    pkg.options.linkedDependencies = (
      pkg.options.linkedDependencies || []
    ).concat(linkedDependencies)

    // Step 1: Apply suffixes
    if (pkg.options.suffix && pkg.options.suffix.length) {
      pkg.suffixAndVersion()
      await pkg.writePackage()
    }
  })

  await runInParallel(workspacePackages, async pkg => {
    // Step 2: Build packages
    if (pkg.options.build) {
      if (watch) {
        pkg.watch(options)
      } else {
        await pkg.build(options)
      }
    }
    // Step 3: Link dependencies and Fix packages
    pkg.syncLinkedDependencies()
    pkg.autoFix()
    pkg.writePackage()
  })
  performance.mark('Stop build')

  performance.measure('Finished build', 'Start build', 'Stop build')
}
