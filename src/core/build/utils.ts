import { resolve, dirname, basename } from 'upath'
import type { OutputOptions } from 'rollup'

export const getNameFunction =
  (rootDir: string, packageName: string) =>
  (
    filename: string | undefined,
    defaultSuffix = '',
    defaultFormat?: OutputFormat
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
      format: formatForName(
        filename ? basename(filename) : `${packageName}${defaultSuffix}.js`,
        defaultFormat
      ),
    } as const
  }

type OutputFormat = OutputOptions['format']

const formats: OutputFormat[] = [
  'amd',
  'cjs',
  'es',
  'iife',
  'system',
  'umd',
  'commonjs',
  'esm',
  'module',
  'systemjs',
]

export const formatForName = (
  filename: string,
  defaultFormat: OutputFormat = 'cjs'
): OutputFormat => {
  const parts = filename.split('.')
  if (parts.length > 2) {
    const format = parts[parts.length - 2] as OutputFormat
    if (formats.includes(format)) return format
  }
  if (parts[parts.length - 1] === 'mjs') return 'module'
  return defaultFormat
}

export const convertToUMDName = (name: string) => {
  const unnamspacedName = name.split('/').pop()

  return (unnamspacedName || name)
    .replace(/-./g, r => r[1].toUpperCase())
    .replace(/^./, r => r.toUpperCase())
}
