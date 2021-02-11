import { resolve } from 'upath'

import { Package, runInParallel } from '../../core'
import { bold, gray } from 'chalk'
import { existsSync } from 'fs-extra'

interface RunCommandOptions {
  file: string
  args: string[]
  options: {
    workspaces?: boolean
    sequential?: boolean
  }
}

export async function run(
  rootPackage: Package,
  { file, args, options: { workspaces, sequential } }: RunCommandOptions
) {
  const fullCommand = `${file} ${args.join()}`.trim()
  const filepath = resolve(process.cwd(), file)
  const isLocalFile =
    (file.endsWith('.js') || file.endsWith('.ts')) && existsSync(filepath)

  function runCommand(pkg: Package) {
    try {
      if (isLocalFile)
        return pkg.execInteractive(
          `yarn siroc-runner ${filepath} ${args.join()}`
        )

      const { stdout } = pkg.exec(fullCommand, {
        silent: true,
      })

      pkg.logger.success(
        `Ran ${bold(fullCommand)} in ${bold(pkg.pkg.name)}.`,
        stdout ? '\n' : '',
        stdout ? gray(stdout) : ''
      )
    } catch (e) {
      pkg.logger.error(`Error running ${bold(fullCommand)}\n`, gray(e))
      process.exit(1)
    }
  }

  const packages = workspaces
    ? await rootPackage.getWorkspacePackages()
    : [rootPackage]

  if (!sequential) {
    runInParallel(packages, runCommand)
  } else {
    packages.forEach(runCommand)
  }
}
