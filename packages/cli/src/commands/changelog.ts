import { writeFile } from 'fs-extra'
import { getChangelog, Package } from '@siroc/core'

export async function changelog(rootPackage: Package) {
  const changelog = await getChangelog(rootPackage)

  process.stdout.write('\n\n' + changelog + '\n\n')
  await writeFile('CHANGELOG.md', changelog, 'utf-8')
}
