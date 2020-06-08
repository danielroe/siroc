import type { RollupBuild, RollupOptions } from 'rollup'

import type { RequireProperties } from '../utils'
import type { BuildConfigOptions } from '../config/rollup'
import { Package } from './package'

export type Hook<T> = {
  (pkg: Package, options: T): Promise<void> | void
}

export type Hooks<T extends Record<string, any>> = {
  [P in keyof T]?: Hook<T[P]> | Array<Hook<T[P]>>
}

export type PackageHookOptions = {
  'build:extend': {
    config: RequireProperties<BuildConfigOptions, 'alias' | 'replace'>
  }
  'build:extendRollup': {
    rollupConfig: RollupOptions[]
  }
  'build:done': { bundle: RollupBuild }
}

export type PackageHooks = Hooks<PackageHookOptions>
