import type { RollupBuild } from 'rollup'

import type { RequireProperties } from '../utils'
import type { NuxtRollupOptions, NuxtRollupConfig } from '../config/rollup'

export interface PackageHookOptions {
  'build:extend': {
    config: RequireProperties<NuxtRollupOptions, 'alias' | 'replace'>
  }
  'build:extendRollup': {
    rollupConfig: NuxtRollupConfig[]
  }
  'build:done': { bundle: RollupBuild }
}

export interface Hook<T> {
  (options: T): void | Array<(options: T) => void>
}

export type Hooks<T extends Record<string, any>> = {
  [P in keyof T]?: Hook<T[P]>
}

export type PackageHooks = Hooks<PackageHookOptions>
