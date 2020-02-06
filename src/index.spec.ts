import { ofType, unionize, UnionOf, TaggedRecordOf, Unionized } from '.';

describe('merged', () => {
  const Foo = unionize({
    x: ofType<{ n: number }>(),
    y: ofType<{ s: string }>(),
    z: ofType<{}>(),
  });

  let foo: typeof Foo._Union;

  beforeEach(() => {
    foo = Foo.x({ n: 3 });
  });

  it('creation', () => {
    expect(foo).toEqual({
      tag: 'x',
      n: 3,
    });
    expect(Foo.z()).toEqual(Foo.z({}));
  });

  it('predicates', () => {
    expect(Foo.is.x(foo)).toBe(true);
    expect(Foo.is.y(foo)).toBe(false);
  });

  it('casts', () => {
    expect(Foo.as.x(foo).n).toBe(3);
    expect(() => Foo.as.y(foo)).toThrow('Attempted to cast x as y');
  });

  it('matching', () => {
    expect(
      Foo.match({
        x: ({ n }) => n + 9,
        y: ({ s }) => s.length,
        z: () => 42,
      })(foo),
    ).toBe(12);
    expect(
      Foo.match({
        y: ({ s }) => s.length,
        default: _ => 42,
      })(foo),
    ).toBe(42);
  });

  it('inline matching', () => {
    expect(
      Foo.match(foo, {
        x: ({ n }) => n + 9,
        y: ({ s }) => s.length,
        z: () => 42,
      }),
    ).toBe(12);
    expect(
      Foo.match(foo, {
        y: ({ s }) => s.length,
        default: _ => 42,
      }),
    ).toBe(42);
  });

  it('accepts undefined props with default for matching', () => {
    expect(
      Foo.match({
        y: ({ s }) => s.length,
        x: undefined,
        default: () => 42,
      })(Foo.x({ n: 3 })),
    ).toBe(42);
  });

  it('default accepts initial object for matching', () => {
    expect(Foo.match({ default: f => f })(foo)).toBe(foo);
    expect(Foo.match(foo, { default: f => f })).toBe(foo);
  });

  describe('name conflicts', () => {
    it('avoidable', () => {
      const T = unionize(
        {
          foo: ofType<{ x: number }>(),
        },
        { tag: 'conflict' },
      );
      const input = { x: 42, conflict: 'oops' };
      expect(T.foo(input).conflict).toBe('foo');
    });
  });
});

describe('separate', () => {
  const Foo = unionize(
    {
      x: ofType<number>(),
      y: ofType<string>(),
    },
    { tag: 'flim', value: 'flam' },
  );

  let foo: typeof Foo._Union;

  beforeEach(() => {
    foo = Foo.x(3);
  });

  it('creation', () => {
    expect(foo.flim).toBe('x');
    expect(foo.flam).toBe(3);
  });

  it('predicates', () => {
    expect(Foo.is.x(foo)).toBe(true);
    expect(Foo.is.y(foo)).toBe(false);
  });

  it('casts', () => {
    expect(Foo.as.x(foo)).toBe(3);
    expect(() => Foo.as.y(foo)).toThrow('Attempted to cast x as y');
  });

  it('matching', () => {
    expect(
      Foo.match({
        x: n => n + 9,
        y: s => s.length,
      })(foo),
    ).toBe(12);

    expect(
      Foo.match({
        y: s => s.length,
        default: _ => 42,
      })(foo),
    ).toBe(42);
  });

  it('inline matching', () => {
    expect(
      Foo.match(foo, {
        x: n => n + 9,
        y: s => s.length,
      }),
    ).toBe(12);

    expect(
      Foo.match(foo, {
        y: s => s.length,
        default: _ => 42,
      }),
    ).toBe(42);
  });

  it('accepts undefined props with default for matching', () => {
    expect(
      Foo.match({
        y: s => s.length,
        x: undefined,
        default: () => 42,
      })(Foo.x(3)),
    ).toBe(42);
  });

  it('default accepts initial object for matching', () => {
    expect(Foo.match({ default: f => f })(foo)).toBe(foo);
    expect(Foo.match(foo, { default: f => f })).toBe(foo);
  });

  it('enumerable tags', () => {
    const Bar = unionize(
      {
        x: ofType<number>(),
        y: ofType<string>(),
        z: ofType<boolean>(),
      },
      { tag: 'blum', value: 'blam' },
    );

    const bar = Foo.match(Bar)(foo);
    expect(bar.blum).toBe('x');
    expect(bar.blam).toBe(3);
  });
});

describe('spreads', () => {
  const Parents = unionize(
    {
      fred: ofType<string>(),
      wilma: ofType<string>(),
    },
    { tag: 'name', value: 'catchphrase' },
  );

  const Flintstones = unionize(
    {
      pebbles: ofType<string>(),
      ...Parents._Record,
    },
    { tag: 'name', value: 'catchphrase' },
  );

  let fred: typeof Flintstones._Union;
  let wilma: typeof Flintstones._Union;
  let pebbles: typeof Flintstones._Union;

  beforeEach(() => {
    fred = Flintstones.fred('Yabba-Dabba-Doo!');
    wilma = Flintstones.wilma('Da-da-da duh da-da CHARGE IT!!');
    pebbles = Flintstones.pebbles('Yabba-Dabba-Doozie!');
  });

  it('creator', () => {
    expect(pebbles).toEqual({
      name: 'pebbles',
      catchphrase: 'Yabba-Dabba-Doozie!',
    });
    expect(fred).toEqual({
      name: 'fred',
      catchphrase: 'Yabba-Dabba-Doo!',
    });
    expect(Flintstones.wilma('Da-da-da duh da-da CHARGE IT!!')).toEqual({
      name: 'wilma',
      catchphrase: 'Da-da-da duh da-da CHARGE IT!!',
    });
  });

  it('predicate', () => {
    expect(Flintstones.is.pebbles(pebbles)).toEqual(true);
    expect(Flintstones.is.pebbles(pebbles)).toEqual(true);
  });

  it('cast', () => {
    expect(Flintstones.as.pebbles(pebbles)).toBe('Yabba-Dabba-Doozie!');
    expect(() => Flintstones.as.fred(pebbles)).toThrow('Attempted to cast pebbles as fred');
    expect(Flintstones.as.fred(fred)).toBe('Yabba-Dabba-Doo!');
    expect(() => Flintstones.as.wilma(fred)).toThrow('Attempted to cast fred as wilma');
    expect(() => Flintstones.as.pebbles(fred)).toThrow('Attempted to cast fred as pebbles');
  });

  it('matching', () => {
    expect(
      Flintstones.match({
        fred: c => 'Father says: ' + c,
        wilma: c => c,
        pebbles: c => c,
      })(fred),
    ).toBe('Father says: Yabba-Dabba-Doo!');
    expect(
      Flintstones.match({
        fred: c => c,
        wilma: c => c,
        pebbles: c => 'Daughter says: ' + c,
      })(pebbles),
    ).toBe('Daughter says: Yabba-Dabba-Doozie!');
  });

  // note: TagProp and ValProp of spreaded _Record has no signficance on final record
  it('creation with different TagProp and ValProp', () => {
    const foo = unionize({ a: ofType<{ x: number }>() }, { tag: 'type', value: 'payload' });
    const bar = unionize(
      { b: ofType<{ y: string }>(), ...foo._Record },
      { tag: 'schmype', value: 'schmayload' },
    );

    expect(bar.a({ x: 1 })).toEqual({
      schmype: 'a',
      schmayload: { x: 1 },
    });

    expect(bar.b({ y: 'qwertz' })).toEqual({
      schmype: 'b',
      schmayload: { y: 'qwertz' },
    });
  });
});

describe('config object', () => {
  it('can have only value prop', () => {
    const A = unionize({ a: ofType<number>() }, { value: 'val' });
    expect(A.a(1)).toEqual({ tag: 'a', val: 1 });
  });
});

describe('transform with value prop', () => {
  const Payload = unionize(
    {
      num: ofType<number>(),
      str: ofType<string>(),
    },
    { value: 'payload' },
  );

  it('skips unmet cases', () => {
    const num = Payload.num(1);
    expect(Payload.transform(num, { str: s => Payload.num(s.length) })).toBe(num);
    expect(Payload.transform({ str: s => Payload.num(s.length) })(num)).toBe(num);
  });

  it('transforms with met cases', () => {
    const str = Payload.str('s');
    const expected = Payload.num(1);
    expect(Payload.transform(str, { str: s => Payload.num(s.length) })).toEqual(expected);
    expect(Payload.transform({ str: s => Payload.num(s.length) })(str)).toEqual(expected);
  });

  it('technically we allow an empty object for cases', () => {
    const str = Payload.str('s');
    expect(Payload.transform(str, {})).toBe(str);
    expect(Payload.transform({})(str)).toBe(str);
  });
});

describe('transform without value prop', () => {
  const Data = unionize({
    num: ofType<{ n: number }>(),
    str: ofType<{ s: string }>(),
  });

  it('Just all at once', () => {
    const num = Data.num({ n: 1 });
    const str = Data.str({ s: 's' });

    const strLen = ({ s }: { s: string }) => Data.num({ n: s.length });

    // unmet
    expect(Data.transform(num, { str: strLen })).toBe(num);
    expect(Data.transform({ str: strLen })(num)).toBe(num);

    //met cases
    expect(Data.transform(str, { str: strLen })).toEqual(num);
    expect(Data.transform({ str: strLen })(str)).toEqual(num);
  });
});

describe('type accessors', () => {
  describe('unionOf', () => {
    it('should be usable', () => {
      const T = unionize({
        foo: ofType<{ x: number }>(),
      });
      type ActionType = UnionOf<typeof T>;
    });
  });
  describe('TaggedRecordOf', () => {
    it('should be usable', () => {
      const T = unionize({
        foo: ofType<{ x: number }>(),
      });
      type TaggedRecord = TaggedRecordOf<typeof T>;
    });
  });
});

describe('separate with union value', () => {
  const Foo = unionize(
    {
      union: ofType<{ status: 'a' } | { status: 'b'; payload: string }>(),
    },
    { tag: 'not_tag', value: 'value' },
  );

  it('creation', () => {
    Foo.union({ status: 'b', payload: 'something' });
  });
});
