import { basename } from 'path'

export const getEntrypointFilenames = (path: string) => {
  if (path.startsWith('./')) path = path.slice(2)

  const basefile = basename(path).split('.').slice(0, -1).join('.')
  const withoutType = basefile.split('.').slice(0, 1).join('')
  const filenames = Array.from(
    new Set([
      basefile,
      `${basefile}/index`,
      withoutType,
      `${withoutType}/index`,
      'index',
    ])
  )
    .map(name => [`${name}.ts`, `${name}.js`])
    .reduce((names, arr) => {
      arr.forEach(name => names.push(name))
      return names
    }, [] as string[])

  return filenames
}
