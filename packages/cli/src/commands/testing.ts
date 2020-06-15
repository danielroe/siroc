import { join } from 'path'

import { Package } from '@siroc/core'
import { bold, gray } from 'chalk'
import consola from 'consola'

interface RunCommandOptions {
  packages: string[]
  options?: Record<string, any>
}

export async function test({ packages }: RunCommandOptions) {
  function runCommand(pkg: Package) {
    let jestConfig
    try {
      jestConfig = join(
        require.resolve('@siroc/jest-preset'),
        '../jest.config.js'
      )
      const { stdout } = pkg.execInteractive('yarn', `jest -c ${jestConfig}`)
      if (stdout) stdout.pipe(process.stdout)
    } catch (e) {
      if (!jestConfig) {
        consola.error(`Couldn't resolve jest config.\n`, gray(e))
      } else {
        consola.error(
          `Error running ${bold('jest')} -c ${jestConfig}\n`,
          gray(e)
        )
      }
    }
  }

  const rootPackage = new Package()

  if (packages.length) {
    const workspacePackages = await rootPackage.getWorkspacePackages(packages)
    workspacePackages.forEach(async pkg => runCommand(pkg))
  } else {
    runCommand(rootPackage)
  }
}
