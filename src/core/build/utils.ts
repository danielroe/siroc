import { resolve, dirname, basename } from 'path'

export const getNameFunction = (rootDir: string, packageName: string) => (
  filename: string | undefined,
  defaultSuffix = ''
) => {
  return {
    dir: filename
      ? resolve(rootDir, dirname(filename))
      : resolve(rootDir, 'dist'),
    entryFileNames: filename
      ? basename(filename)
      : `${packageName}${defaultSuffix}.js`,
    chunkFileNames: filename
      ? `${basename(filename)}-[name].js`
      : `${packageName}-[name]${defaultSuffix}.js`,
  } as const
}
