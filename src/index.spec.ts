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

describe('spreads', () => {

  const Parents = unionize({
    fred: ofType<string>(),
    wilma: ofType<string>(),
  }, 'name', 'catchphrase')

  const Flintstones = unionize({
    pebbles: ofType<string>(),
    ...Parents._Record
  }, 'name', 'catchphrase')

  let fred: typeof Flintstones._Union
  let wilma: typeof Flintstones._Union
  let pebbles: typeof Flintstones._Union

  beforeEach(() => {
    fred = Flintstones.fred('Yabba-Dabba-Doo!')
    wilma = Flintstones.wilma('Da-da-da duh da-da CHARGE IT!!')
    pebbles = Flintstones.pebbles('Yabba-Dabba-Doozie!')
  })

  it('creator', () => {
    expect(pebbles).toEqual({
      name: 'pebbles',
      catchphrase: 'Yabba-Dabba-Doozie!'
    })
    expect(fred).toEqual({
      name: 'fred',
      catchphrase: 'Yabba-Dabba-Doo!'
    })
    expect(Flintstones.wilma('Da-da-da duh da-da CHARGE IT!!')).toEqual({
      name: 'wilma',
      catchphrase: 'Da-da-da duh da-da CHARGE IT!!'
    })
  })

  it('predicate', () => {
    expect(Flintstones.is.pebbles(pebbles)).toEqual(true)
    expect(Flintstones.is.pebbles(pebbles)).toEqual(true)
  })

  it('cast', () => {
    expect(Flintstones.as.pebbles(pebbles)).toBe('Yabba-Dabba-Doozie!')
    expect(() => Flintstones.as.fred(pebbles)).toThrow('Attempted to cast pebbles as fred')
    expect(Flintstones.as.fred(fred)).toBe('Yabba-Dabba-Doo!')
    expect(() => Flintstones.as.wilma(fred)).toThrow('Attempted to cast fred as wilma')
    expect(() => Flintstones.as.pebbles(fred)).toThrow('Attempted to cast fred as pebbles')
  })

  it('matching', () => {
    expect(Flintstones.match({
      fred: c => 'Father says: ' + c,
      wilma: c => c,
      pebbles: c => c
    })(fred)).toBe('Father says: Yabba-Dabba-Doo!')
    expect(Flintstones.match({
      fred: c => c,
      wilma: c => c,
      pebbles: c => 'Daughter says: ' + c
    })(pebbles)).toBe('Daughter says: Yabba-Dabba-Doozie!')
  })

  // note: TagProp and ValProp of spreaded _Record has no signficance on final record
  it('creation with different TagProp and ValProp', () => {
    const foo = unionize({ a: ofType<{ x: number}>() }, 'type', 'payload')
    const bar = unionize({ b: ofType<{ y: string}>(), ...foo._Record }, 'schmype', 'schmayload')

    expect(bar.a({ x: 1 })).toEqual({
      schmype: 'a',
      schmayload: { x: 1 }
    })

    expect(bar.b({ y: 'qwertz' })).toEqual({
      schmype: 'b',
      schmayload: { y: 'qwertz' }
    })
  })
})