import { Package } from '.'
describe('empty', () => {
  // eslint-disable-next-line
  test('test', async () => {
    const pkg = new Package()
    expect(pkg).toBeDefined()
  })
})
