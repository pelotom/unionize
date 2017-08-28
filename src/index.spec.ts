import { ofType, unionize } from '.'

const Foo = unionize({
  x: ofType<number>(),
  y: ofType<string>(),
}, 'flim', 'flam')

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

it('enumerable tags', () => {
  const Bar = unionize({
    x: ofType<number>(),
    y: ofType<string>(),
    z: ofType<boolean>(),
  })

  const bar = Foo.match(Bar)(foo)
  expect(bar.tag).toBe('x')
  expect(bar.value).toBe(3)
})
