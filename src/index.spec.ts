import { unionizeCustom } from '.'

const Foo = unionizeCustom('flim', 'flam')<{
  x: number
  y: string
}>()

let foo: typeof Foo._Union

beforeEach(() => {
  foo = Foo.x(3)
})

it('creation', () => {
  expect(foo.flim).toBe('x')
  expect(foo.flam).toBe(3)
})

it('predicates', () => {
  expect(Foo.is.x(foo)).toBe(true)
  expect(Foo.is.y(foo)).toBe(false)
})

it('matching', () => {
  expect(Foo.match({
    x: n => n + 9,
    y: s => s.length,
  })(foo)).toBe(12)
  expect(Foo.match(
    { y: s => s.length, },
    () => 42,
  )(foo)).toBe(42)
})
