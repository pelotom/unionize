export type Unionized<Record, TaggedRecord> = {
  _Tags: keyof TaggedRecord;
  _Record: Record;
  _Union: TaggedRecord[keyof TaggedRecord];
  is: Predicates<TaggedRecord>;
  as: Casts<Record, TaggedRecord[keyof TaggedRecord]>;
  match: Match<Record, TaggedRecord[keyof TaggedRecord]>;
} & Creators<Record, TaggedRecord>;

export type Creators<Record, TaggedRecord> = {
  [T in keyof Record]: (value: Record[T]) => TaggedRecord[keyof TaggedRecord]
};

export type Predicates<TaggedRecord> = {
  [T in keyof TaggedRecord]: (
    variant: TaggedRecord[keyof TaggedRecord],
  ) => variant is TaggedRecord[T]
};

export type Casts<Record, Union> = { [T in keyof Record]: (variant: Union) => Record[T] };

export type Cases<Record, A> = { [T in keyof Record]: (value: Record[T]) => A };

export type MatchCases<Record, Union, A> =
  | Cases<Record, A> & NoDefaultProp
  | Partial<Cases<Record, A>> & { default: (variant: Union) => A };

export type Match<Record, Union> = {
  <A>(cases: MatchCases<Record, Union, A>): (variant: Union) => A;
  <A>(variant: Union, cases: MatchCases<Record, Union, A>): A;
};

export type MultiValueVariants<Record extends MultiValueRec, TagProp extends string> = {
  [T in keyof Record]: { [_ in TagProp]: T } & Record[T]
};

export type SingleValueVariants<
  Record extends SingleValueRec,
  TagProp extends string,
  ValProp extends string
> = { [T in keyof Record]: { [_ in TagProp]: T } & { [_ in ValProp]: Record[T] } };

// Forbid usage of default property; reserved for pattern matching.
export type NoDefaultProp = { default?: never };

export type SingleValueRec = NoDefaultRec<{} | null>;
export type MultiValueRec = NoDefaultRec<{ [tag: string]: any }>;
export type NoDefaultRec<Val> = {
  [k: string]: Val;
} & NoDefaultProp;

/**
 * Create a tagged union from a record mapping tags to value types, along with associated
 * variant constructors, type predicates and `match` function.
 *
 * @param record A record mapping tags to value types. The actual values of the record don't
 * matter; they're just used in the types of the resulting tagged union. See `ofType`.
 * @param tagProp An optional custom name for the tag property of the union.
 * @param valProp An optional custom name for the value property of the union. If not specified,
 * the value must be a dictionary type.
 */
export function unionize<Record extends MultiValueRec>(
  record: Record,
): Unionized<Record, MultiValueVariants<Record, 'tag'>>;
export function unionize<Record extends MultiValueRec, TagProp extends string>(
  record: Record,
  tagProp: TagProp,
): Unionized<Record, MultiValueVariants<Record, TagProp>>;
export function unionize<
  Record extends SingleValueRec,
  TagProp extends string,
  ValProp extends string
>(
  record: Record,
  tagProp: TagProp,
  valProp: ValProp,
): Unionized<Record, SingleValueVariants<Record, TagProp, ValProp>>;
export function unionize<Record>(record: Record, tagProp = 'tag', valProp?: string) {
  const creators = {} as Creators<Record, any>;
  for (const tag in record) {
    creators[tag] = (value: any) =>
      valProp ? { [tagProp]: tag, [valProp]: value } : { ...value, [tagProp]: tag };
  }

  const is = {} as Predicates<any>;
  for (const tag in record) {
    is[tag] = ((variant: any) => variant[tagProp] === tag) as any;
  }

  function evalMatch(variant: any, cases: any): any {
    const k = variant[tagProp];
    const handler = cases[k];
    return handler !== undefined
      ? handler(valProp ? variant[valProp] : variant)
      : cases.default(variant);
  }

  const match: ReverseCurriedFunc<any, any, any> = reverseCurry(evalMatch);

  const as = {} as Casts<Record, any>;
  for (const expectedTag in record) {
    as[expectedTag] = match({
      [expectedTag]: (x: any) => x,
      default: (val: any) => {
        throw new Error(`Attempted to cast ${val[tagProp]} as ${expectedTag}`);
      },
    });
  }

  return Object.assign(
    {
      is,
      as,
      match,
      _Record: record,
    },
    creators,
  );
}

type ReverseCurriedFunc<A1, A2, R> = {
  (a1: A1, a2: A2): R;
  (a2: A2): (a1: A1) => R;
};

function reverseCurry<A1, A2, R, F extends (a1: A1, a2: A2) => R>(
  f: F,
): ReverseCurriedFunc<A1, A2, R> {
  const func = function reverseCurried(a1: A1 | A2, a2: A2 | undefined) {
    if (arguments.length == 1) {
      return (a: A1) => f(a, <A2>a1);
    }

    return f(<A1>a1, <A2>a2);
  };

  return (func as any) as ReverseCurriedFunc<A1, A2, R>;
}

/**
 * Creates a pseudo-witness of a given type. That is, it pretends to return a value of
 * type `T` for any `T`, but it's really just returning `undefined`. This white lie
 * allows convenient expression of the value types in the record you pass to `unionize`.
 */
export const ofType = <T>() => (undefined as any) as T;

export default unionize;
