import { ofType, unionize } from '.'

describe('merged', () => {

    const Foo = unionize({
      x: ofType<{ n: number }>(),
      y: ofType<{ s: string }>(),
    })

    let foo: typeof Foo._Union

    beforeEach(() => {
      foo = Foo.x({ n: 3 })
    })

    it('creation', () => {
      expect(foo).toEqual({
        tag: 'x',
        n: 3,
      })
    })

    it('predicates', () => {
      expect(Foo.is.x(foo)).toBe(true)
      expect(Foo.is.y(foo)).toBe(false)
    })

    it('casts', () => {
      expect(Foo.as.x(foo).n).toBe(3)
      expect(() => Foo.as.y(foo)).toThrow('Attempted to cast x as y')
    })

    it('matching', () => {
      expect(Foo.match({
        x: ({ n }) => n + 9,
        y: ({ s }) => s.length,
      })(foo)).toBe(12)
      expect(Foo.match({
        y: ({ s }) => s.length,
        default: _ => 42
      })(foo)).toBe(42)
    })
    
    it('accepts undefined props with default for matching', () => {
      expect(Foo.match({
        y: ({ s }) => s.length,
        x: undefined,
        default: () => 42,
      })(Foo.x({n:3}))).toBe(42)
    })

    it('default accepts initial object for matching', () => {
      expect(Foo.match({ default: f => f })(foo)).toBe(foo)
    })

    describe('name conflicts', () => {
      it('avoidable', () => {
        const T = unionize({
          foo: ofType<{ x: number }>(),
        }, 'conflict')
        const input = { x: 42, conflict: 'oops' }
        expect(T.foo(input).conflict).toBe('foo')
      })
    })
  })

describe('separate', () => {

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

  it('casts', () => {
    expect(Foo.as.x(foo)).toBe(3)
    expect(() => Foo.as.y(foo)).toThrow('Attempted to cast x as y')
  })

  it('matching', () => {
    expect(Foo.match({
      x: n => n + 9,
      y: s => s.length,
    })(foo)).toBe(12)

    expect(Foo.match({
      y: s => s.length,
      default: _ => 42,
    })(foo)).toBe(42)
  })

  it('accepts undefined props with default for matching', () => {
    expect(Foo.match({
      y: s => s.length,
      x: undefined,
      default: () => 42,
    })(Foo.x(3))).toBe(42)
  })

  it('default accepts initial object for matching', () => {
    expect(Foo.match({ default: f => f })(foo)).toBe(foo)
  })

  it('enumerable tags', () => {
    const Bar = unionize({
      x: ofType<number>(),
      y: ofType<string>(),
      z: ofType<boolean>(),
    }, 'blum', 'blam')

    const bar = Foo.match(Bar)(foo)
    expect(bar.blum).toBe('x')
    expect(bar.blam).toBe(3)
  })
})
