jest.mock('esm', () => (module: NodeModule) => (id: string) =>
  module.require(id)
)
