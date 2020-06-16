import {
  build as buildPackage,
  Package,
  removeBuildFolders,
  runInParallel,
  BuildOptions,
} from '@siroc/core'
import consola from 'consola'

export interface BuildCommandOptions extends BuildOptions {
  packages: string[]
}

export async function build(
  rootPackage: Package,
  { packages, ...options }: BuildCommandOptions
) {
  const workspacePackages = await rootPackage.getWorkspacePackages(
    packages.length ? packages : undefined
  )

  const { watch } = options
  consola.info(`Beginning build${watch ? ' (watching)' : ''}`)

  // Universal linkedDependencies based on workspace
  const linkedDependencies = workspacePackages.map(p =>
    p.pkg.name.replace(p.options.suffix, '')
  )

  // Create package stubs so we can build in parallel
  await runInParallel(workspacePackages, async pkg => {
    await removeBuildFolders(pkg)
    await pkg.createStubs()
  })

  await runInParallel(workspacePackages, async pkg => {
    pkg.options.linkedDependencies = (
      pkg.options.linkedDependencies || []
    ).concat(linkedDependencies)

    // Step 1: Apply suffixes
    if (pkg.options.suffix && pkg.options.suffix.length) {
      pkg.suffixAndVersion()
      await pkg.writePackage()
    }

    // Step 2: Build packages
    if (pkg.options.build) {
      if (watch) {
        buildPackage(pkg, { dev: true, ...options, watch })
      } else {
        await buildPackage(pkg, options)
      }
    }

    // Step 3: Link dependencies and Fix packages
    pkg.syncLinkedDependencies()
    pkg.autoFix()
    await Promise.all([pkg.setBinaryPermissions(), pkg.writePackage()])
  })
}
