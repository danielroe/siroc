import consola from 'consola'
import execa from 'execa'

import { ensureUnique, groupBy } from '../utils'

const types = {
  fix: { title: '🐛 Bug Fixes' },
  feat: { title: '🚀 Features' },
  refactor: { title: '💅 Refactors' },
  perf: { title: '🔥 Performance' },
  examples: { title: '📝 Examples' },
  chore: { title: '🏡 Chore' },
  test: { title: '👓 Tests' },
  types: { title: '🇹 Types' },
} as const

type CommitType = keyof typeof types
const allowedTypes = Object.keys(types) as CommitType[]

// TODO: read from package.json
const knownAuthors: string[] = []

const isKnownAuthor = (name: string) =>
  knownAuthors.some(n => name.toLowerCase().includes(n))

interface Commit {
  message: string
  commit: string
  authorName: string
  authorEmail: string
}

interface ConventionalCommit extends Commit {
  type: CommitType
  scope: string
  references: string[]
}

export async function getChangelog() {
  // Get last git tag
  const lastGitTag = await getLastGitTag()

  // Get current branch
  const currentGitBranch = await getCurrentGitBranch()

  // Get all commits from last release to current branch
  consola.log(`${currentGitBranch}...${lastGitTag}`)
  const commits = await getGitDiff(currentGitBranch, lastGitTag)

  // Parse commits as conventional commits
  const conventionalCommits = parseCommits(commits).filter(
    c => allowedTypes.includes(c.type) && c.scope !== 'deps'
  )

  // Generate markdown
  return generateMarkDown(conventionalCommits)
}

async function execCommand(cmd: string, args: string[]) {
  const r = await execa(cmd, args)
  return r.stdout
}

async function getLastGitTag() {
  const r = await execCommand('git', [
    '--no-pager',
    'tag',
    '-l',
    '--sort=taggerdate',
  ]).then(r => r.split('\n'))
  return r[r.length - 1]
}

async function getCurrentGitBranch() {
  const r = await execCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
  return r
}

async function getGitDiff(from: string, to: string) {
  // # https://git-scm.com/docs/pretty-formats
  const r = await execCommand('git', [
    '--no-pager',
    'log',
    `${from}...${to}`,
    '--pretty=%s|%h|%an|%ae',
  ])
  return r.split('\n').map(line => {
    const [message, commit, authorName, authorEmail] = line.split('|')

    return { message, commit, authorName, authorEmail }
  })
}

function parseCommits(commits: Commit[]): ConventionalCommit[] {
  return commits
    .filter(c => c.message.includes(':'))
    .map(commit => {
      const [type, ...messages] = commit.message.split(':')
      let message = messages.join(':')

      // Extract references from message
      message = message.replace(/\((fixes) #\d+\)/g, '')
      const references = []
      const referencesRegex = /#[0-9]+/g
      let m
      while ((m = referencesRegex.exec(message))) {
        // eslint-disable-line no-cond-assign
        references.push(m[0])
      }

      // Remove references and normalize
      message = message.replace(referencesRegex, '').replace(/\(\)/g, '').trim()

      // Extract scope from type
      const matches = type.match(/\((.*)\)/)
      const scope = (matches && matches[1]) || 'general'

      return {
        ...commit,
        message,
        type: type.split('(')[0] as CommitType,
        scope,
        references,
      }
    })
}

function generateMarkDown(commits: ConventionalCommit[]) {
  const typeGroups = groupBy(commits, 'type')

  let markdown = ''

  for (const type of allowedTypes) {
    const group = typeGroups[type]
    if (!group || !group.length) continue

    const { title } = types[type]
    markdown += '\n\n' + '### ' + title + '\n\n'

    const scopeGroups = groupBy(group, 'scope')
    for (const scopeName in scopeGroups) {
      markdown += '- `' + scopeName + '`' + '\n'
      for (const commit of scopeGroups[scopeName]) {
        markdown +=
          '  - ' +
          commit.references.join(', ') +
          (commit.references.length ? ' ' : '') +
          commit.message.replace(/^(.)/, v => v.toUpperCase()) +
          '\n'
      }
    }
  }
  const authors = ensureUnique(
    commits.map(commit => commit.authorName).filter(an => !isKnownAuthor(an))
  ).sort()

  if (authors.length) {
    markdown += '\n\n' + '### ' + '💖 Thanks to' + '\n\n'
    markdown += authors.map(name => '- ' + name).join('\n')
  }

  return markdown.trim()
}
