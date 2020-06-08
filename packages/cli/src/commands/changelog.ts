import { writeFile } from 'fs-extra'
import { getChangelog } from '@siroc/core'

export async function changelog() {
  const changelog = await getChangelog()

  process.stdout.write('\n\n' + changelog + '\n\n')
  await writeFile('CHANGELOG.md', changelog, 'utf-8')
}
