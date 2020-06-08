import cac from 'cac'
import consola from 'consola'

import { version } from '../../package.json'

import { build, BuildOptions } from './commands/build'
import { changelog } from './commands/changelog'

const cli = cac('packager')

const run = async <A extends (...args: any[]) => Promise<void>>(
  action: A,
  ...args: Parameters<A>
) => {
  await action(...args).catch(err => {
    consola.error(err)
    process.exit(1)
  })
}

cli
  .command('build', 'Bundle input files')
  .option('--watch', 'Watch files in bundle and rebuild on changes', {
    default: false,
  })
  .option('--dev', 'Build development bundle (only CJS)', {
    default: false,
  })
  .action((options: BuildOptions) => run(build, options))
cli.command('changelog', 'Generate changelog').action(() => run(changelog))

cli.version(version)
cli.help()

cli.parse()

process.on('unhandledRejection', err => {
  consola.error(err)
  process.exit(1)
})
