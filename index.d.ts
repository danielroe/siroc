declare module 'rollup-plugin-license'
declare module 'esm' {
  interface Esm {
    (module: NodeModule): <T = unknown>(id: string) => T
  }
  const _default: Esm
  export default _default
}
