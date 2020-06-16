import { Package, runInParallel } from '@siroc/core'

export interface DevCommandOptions {
  packages: string[]
}

export async function dev(
  rootPackage: Package,
  { packages }: DevCommandOptions
) {
  const workspacePackages = await rootPackage.getWorkspacePackages(
    packages.length ? packages : undefined
  )

  await runInParallel(workspacePackages, async pkg => pkg.createStubs())
}
