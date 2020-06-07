import consola from 'consola'

import { Package } from '../../package'
import { runInParallel } from '../../utils'

export interface BuildOptions {
  watch?: boolean
}

export async function build(options: BuildOptions = {}) {
  // Read package at current directory
  const rootPackage = new Package()
  const workspacePackages = await rootPackage.getWorkspacePackages()

  const { watch } = options
  consola.info(`Beginning build${watch ? ' (watching)' : ''}`)

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
        pkg.watch()
      } else {
        await pkg.build()
      }
    }
    // Step 3: Link dependencies and Fix packages
    pkg.syncLinkedDependencies()
    pkg.autoFix()
    pkg.writePackage()
  })
}
