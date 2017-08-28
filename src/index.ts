export interface Variant<Tag, Value> {
  tag: Tag
  value: Value
}

export type CustomVariant<TagProp extends string, Tag, ValProp extends string, Value> =
  & { [_ in TagProp]: Tag }
  & { [_ in ValProp]: Value }


export type Unionized<Record, TaggedRecord> = {
  _Tags: keyof TaggedRecord;
  _Record: Record;
  _Union: TaggedRecord[keyof TaggedRecord]
  is: Predicates<TaggedRecord>
  match: Match<Record, TaggedRecord>
} & Creators<Record, TaggedRecord>

export type Creators<Record, TaggedRecord> = {
  [T in keyof Record]: (value: Record[T]) => TaggedRecord[keyof TaggedRecord]
}

export type Predicates<TaggedRecord> = {
  [T in keyof TaggedRecord]: (variant: TaggedRecord[keyof TaggedRecord]) => variant is TaggedRecord[T]
}

export type Match<Record, TaggedRecord> = {
  <A>(
    cases: Cases<Record, keyof Record, A>
  ): (variant: TaggedRecord[keyof TaggedRecord]) => A
  <K extends keyof Record, A>(
    cases: Cases<Record, K, A>, fallback: (tag: keyof Record) => A
  ): (variant: TaggedRecord[keyof TaggedRecord]) => A
}

export type Cases<Record, K extends keyof Record, A> = {
  [T in K]: (value: Record[T]) => A
}

export type Tagged<Record> = {
  [T in keyof Record]: Variant<T, Record[T]>
}

export type CustomTagged<Record, TagProp extends string, ValProp extends string> = {
  [T in keyof Record]: CustomVariant<TagProp, T, ValProp, Record[T]>
}

/**
 * Create a tagged union from a record mapping tags to value types, along with associated
 * variant constructors, type predicates and `match` function.
 *
 * @param record A record mapping tags to value types. The actual values of the record don't
 * matter; they're just used in the types of the resulting tagged union. See `ofType`.
 * @param tagProp An optional custom name for the tag property of the union.
 * @param valProp An optional custom name for the value property of the union.
 */
export function unionize<Record>(record: Record): Unionized<Record, Tagged<Record>>
export function unionize<Record, TagProp extends string>(
  record: Record,
  tagProp: TagProp,
): Unionized<Record, CustomTagged<Record, TagProp, 'value'>>
export function unionize<Record, TagProp extends string, ValProp extends string>(
  record: Record,
  tagProp: TagProp,
  valProp: ValProp,
): Unionized<Record, CustomTagged<Record, TagProp, ValProp>>
export function unionize<Record>(record: Record, tagProp = 'tag', valProp = 'value') {
  return unionizeInternal(record, tagProp, valProp)
}

const unionizeInternal = <
  Record,
  TagProp extends string,
  ValProp extends string,
  TaggedRecord = CustomTagged<Record, TagProp, ValProp>
>(record: Record, tagProp: TagProp, valProp: ValProp): Unionized<Record, TaggedRecord> => {
  // Keys and Tags should always be the same as long as no one is overriding the default TaggedRecord,
  // but they need to be tracked separately to keep the type system happy
  type Keys = keyof Record
  type Tags = keyof TaggedRecord
  type Union = TaggedRecord[Tags]

  const creators = {} as Creators<Record, TaggedRecord>
  for (const tag in record) {
    creators[tag] = (value: Record[typeof tag]) => ({
      [tagProp as string]: tag,
      [valProp as string]: value,
    }) as any
  }

  const is = {} as Predicates<TaggedRecord>
  for (const tag in record) {
    is[tag] = ((variant: any) => variant[tagProp] === tag) as any
  }

  function match<A>(cases: Cases<Record, Keys, A>): (variant: Union) => A
  function match<K extends Keys, A>(cases: Cases<Record, K, A>, fallback: (tag: Keys) => A): (variant: Union) => A
  function match<K extends Keys, A>(cases: Cases<Record, K, A>, fallback?: (tag: Keys) => A): (variant: Union) => A {
    return (variant: Union): A => {
      for (const k in cases)
        if (k in is && is[k](variant))
          return cases[k]((variant as any)[valProp])

      if (fallback)
        return fallback((variant as any)[tagProp])

      // throw Error(`match failure: no handler for case ${variant[tagProp as any]}`)
      return undefined as any as A
    }
  }

  return Object.assign({
    _Tags: undefined as any as Tags,
    _Record: undefined as any as Record,
    _Union: undefined as any as Union,
    is,
    match,
  }, creators)
}

/**
 * Creates a pseudo-witness of a given type. That is, it pretends to return a value of
 * type `T` for any `T`, but it's really just returning `undefined`. This white lie
 * allows convenient expression of the value types in the record you pass to `unionize`.
 */
export const ofType = <T>() => undefined as any as T

export default unionize
