import { Package, runInParallel } from '@siroc/core'

export interface DevCommandOptions {
  packages: string[]
}

export async function dev({ packages }: DevCommandOptions) {
  // Read package at current directory
  const rootPackage = new Package()

  const workspacePackages = await rootPackage.getWorkspacePackages(
    packages.length ? packages : undefined
  )

  await runInParallel(workspacePackages, async pkg => pkg.createStubs())
}
