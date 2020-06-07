export type PackageJsonPerson =
  | string
  | {
      name?: string
      email?: string
      url?: string
    }
export interface PackageJson {
  name?: string
  version?: string
  description?: string
  keywords?: string[]
  homepage?: string

  bugs?:
    | string
    | {
        url?: string
        email?: string
      }
  licence?: string
  private?: boolean
  author?: PackageJsonPerson
  contributors?: PackageJsonPerson[]
  files?: string[]
  types?: string
  main?: string
  module?: string
  bin?: string | Record<string, string>
  browser?: string
  man?: string | string[]
  workspaces?: string[]
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}
