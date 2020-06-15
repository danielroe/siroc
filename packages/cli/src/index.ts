import 'v8-compile-cache'
import { resolve } from 'path'
import { PerformanceObserver, performance } from 'perf_hooks'

import cac from 'cac'
import { bold } from 'chalk'
import consola from 'consola'
import { readJSONSync } from 'fs-extra'

import { version } from '../package.json'

import { build, BuildCommandOptions } from './commands/build'
import { changelog } from './commands/changelog'
import { dev, DevCommandOptions } from './commands/dev'
import { run as runFile } from './commands/run'
import { test } from './commands/testing'

import { time, timeEnd } from './utils'

time('assign root JSON')
let exampleProject = '@siroc/cli'
try {
  // eslint-disable-next-line
  const { name } = readJSONSync(resolve(process.cwd(), './package.json'))
  if (name) exampleProject = name
  // eslint-disable-next-line
} catch {}
timeEnd('assign root JSON')

const obs = new PerformanceObserver(items => {
  const { duration, name } = items.getEntries()[0]
  const seconds = (duration / 1000).toFixed(1)
  const time = duration > 1000 ? seconds + 's' : Math.round(duration) + 'ms'
  consola.success(`${name} in ${bold(time)}`)
})
obs.observe({ entryTypes: ['measure'] })

time('load CLI')
const cli = cac('siroc')

const run = async <A extends (...args: any[]) => Promise<void>>(
  type: string,
  action: A,
  ...args: Parameters<A>
) => {
  performance.mark(`Start ${type}`)
  await action(...args).catch(err => {
    consola.error(err)
    process.exit(1)
  })
  performance.mark(`Stop ${type}`)
  performance.measure(`Finished ${type}`, `Start ${type}`, `Stop ${type}`)
}

cli
  .command('build [...packages]', 'Bundle input files')
  .option('-w, --watch', 'Watch files in bundle and rebuild on changes', {
    default: false,
  })
  .option('--dev', 'Build development bundle (only CJS)', {
    default: false,
  })
  .example(bin => `  ${bin} build`)
  .example(bin => `  ${bin} build ${exampleProject} -w`)
  .action((packages: string[], options: BuildCommandOptions) =>
    run('building', build, { ...options, packages })
  )

cli
  .command('changelog', 'Generate changelog')
  .action(() => run('changelog', changelog))

cli
  .command('dev [...packages]', 'Generate package stubs for quick development')
  .example(bin => `  ${bin} dev`)
  .example(bin => `  ${bin} dev ${exampleProject} -w`)
  .action((packages: string[], options: DevCommandOptions) =>
    run('stubbing', dev, { ...options, packages })
  )

cli
  .command('run <file> [...args]', 'Run Node script')
  .allowUnknownOptions()
  .option('-w, --workspaces', 'Run command in all yarn workspaces.')
  .option('-s, --sequential', 'Run sequentially rather than in paralle.')
  .example(bin => `  ${bin} src/test.ts`)
  .example(bin => `  ${bin} --workspaces ls`)
  .action((file, args, options) =>
    run('running', runFile, { file, args, options })
  )

cli
  .command('jest [...packages]', 'Run jest ')
  .example(bin => `  ${bin} jest`)
  .example(bin => `  ${bin} jest @siroc/cli`)
  .action(packages => run('starting jest', test, { packages, command: 'jest' }))

cli
  .command('eslint [...packages]', 'Run eslint ')
  .example(bin => `  ${bin} eslint`)
  .example(bin => `  ${bin} eslint @siroc/cli`)
  .action(packages =>
    run('starting eslint', test, { packages, command: 'eslint' })
  )

cli.version(version)
cli.help()
timeEnd('load CLI')

cli.parse()

process.on('unhandledRejection', err => {
  consola.error(err)
  process.exit(1)
})
