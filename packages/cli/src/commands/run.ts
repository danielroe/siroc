import { resolve } from 'path'

import consola from 'consola'
import { bold, gray } from 'chalk'
import { existsSync } from 'fs-extra'

interface RunCommandOptions {
  file: string
  args: string[]
}

export async function run({ file, args }: RunCommandOptions) {
  const filepath = resolve(process.cwd(), file)
  if (!(file.endsWith('.js') || file.endsWith('.ts'))) {
    return consola.error(`${bold('siroc run')} should take a .js or .ts file.`)
  }
  if (!existsSync(filepath)) {
    return consola.error(`${bold(filepath)} could not be found.`)
  }
  process.argv = [filepath, ...args]
  try {
    // eslint-disable-next-line
    const jiti = require('jiti')(__filename)
    jiti(filepath)
    consola.success(`Ran ${bold(file)}\n`)
  } catch (e) {
    consola.error(
      `Error running ${bold(file)}\n`,
      gray(process.stderr.toString().trim())
    )
  }
}
