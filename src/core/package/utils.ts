import { basename, sep } from 'path'
import type { PackageJson } from './types'

const walkDownDirectory = (pathname: string) => {
  const [first, ...rest] = pathname.split(sep)
  return rest.join(sep)
}

export const getEntrypointFilenames = (path: string) => {
  if (path.startsWith('./')) path = path.slice(2)

  const filenames = new Set<string>()
  let cwd = path
  do {
    const basefile = cwd.split('.').slice(0, -1).join('.')
    const withoutType = basefile.split('.').slice(0, 1).join('')
    ;[
      basefile,
      `${basefile}/index`,
      withoutType,
      `${withoutType}/index`,
    ].forEach(name => filenames.add(name))
    cwd = walkDownDirectory(cwd)
  } while (cwd)

  filenames.add('index')

  return Array.from(filenames)
    .map(name => [`${name}.ts`, `${name}.js`])
    .reduce((names, arr) => {
      arr.forEach(name => names.push(name))
      return names
    }, [] as string[])
}

export const getFlatValues = (
  obj: Exclude<PackageJson['exports'], string | undefined>
) => {
  return Object.values(obj)
    .map(ex => (typeof ex === 'string' ? ex : Object.values(ex)))
    .reduce((flatArray: string[], item) => {
      if (Array.isArray(item)) return [...flatArray, ...item]
      flatArray.push(item)
      return flatArray
    }, [])
}
