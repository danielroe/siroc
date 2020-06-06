import 'v8-compile-cache'

import cac from 'cac'
import consola from 'consola'

import { version } from '../../package.json'

import { build } from './commands/build'
import { changelog } from './commands/changelog'

const cli = cac('packager')

const run = async (action: () => Promise<void>) => {
  await action().catch(err => {
    consola.error(err)
    process.exit(1)
  })
}

cli.command('build', 'Bundle input files').action(() => run(build))
cli.command('changelog', 'Generate changelog').action(() => run(changelog))

cli.version(version)
cli.help()

cli.parse()

process.on('unhandledRejection', err => {
  consola.error(err)
  process.exit(1)
})
