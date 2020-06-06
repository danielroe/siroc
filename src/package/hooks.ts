import type { RollupBuild } from 'rollup'

import type { RequireProperties } from '../utils'
import type { NuxtRollupOptions, NuxtRollupConfig } from '../config/rollup'

export interface HookOptions {
  'build:extend': {
    config: RequireProperties<NuxtRollupOptions, 'alias' | 'replace'>
  }
  'build:extendRollup': {
    rollupConfig: NuxtRollupConfig
  }
  'build:done': { bundle: RollupBuild }
}

export interface Hook<T> {
  (options: T): void | Array<(options: T) => void>
}

export type PackageHooks = {
  [P in keyof HookOptions]?: Hook<HookOptions[P]>
}
