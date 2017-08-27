export interface Variant<Tag, Value> {
  tag: Tag
  value: Value
}

export type CustomVariant<TagProp extends string, Tag, ValProp extends string, Value> =
  & { [_ in TagProp]: Tag }
  & { [_ in ValProp]: Value }

/**
 * Create a tagged union from a record mapping tags to value types, along with associated
 * variant constructors, type predicates and `match` function.
 *
 * @param record A record mapping tags to value types. The actual values of the record don't
 * matter; they're just used in the types of the resulting tagged union. See `ofType`.
 */
export function unionize<Record, TaggedTable = { [T in keyof Record]: Variant<T, Record[T]> }>(record: Record) {
  return unionizeCustom('tag', 'value')<Record, TaggedTable>(record)
}

/**
 * Create a tagged union from a record mapping tags to value types, along with associated
 * variant constructors, type predicates and `match` function.
 *
 * @param tagProp A custom name for the tag property of the union.
 * @param valProp A custom name for the value property of the union.
 * @param record A record mapping tags to value types. The actual values of the record don't
 * matter; they're just used in the types of the resulting tagged union. See `ofType`.
 */
export const unionizeCustom = <
  TagProp extends string,
  ValProp extends string
>(tagProp: TagProp, valProp: ValProp) => <
  Record,
  TaggedTable = { [T in keyof Record]: CustomVariant<TagProp, T, ValProp, Record[T]> }
>(record: Record) => {
  // Keys and Tags should always be the same as long as no one is overriding the default TaggedTable,
  // but they need to be tracked separately to keep the type system happy
  type Keys = keyof Record
  type Tags = keyof TaggedTable
  type Union = TaggedTable[Tags]

  type Creators = { [T in Keys]: (value: Record[T]) => Union }
  const creators = {} as Creators
  for (const tag in record) {
    creators[tag] = (value: Record[typeof tag]) => ({
      [tagProp as string]: tag,
      [valProp as string]: value,
    }) as any
  }

  type Predicates = { [T in Tags]: (variant: Union) => variant is TaggedTable[T] }
  const is = {} as Predicates
  for (const tag in record) {
    is[tag] = ((variant: any) => variant[tagProp] === tag) as any
  }

  type Cases<K extends Keys, A> = {
    [T in K]: (value: Record[T]) => A
  }
  function match<A>(cases: Cases<Keys, A>): (variant: Union) => A
  function match<K extends Keys, A>(cases: Cases<K, A>, fallback: (tag: Keys) => A): (variant: Union) => A
  function match<K extends Keys, A>(cases: Cases<K, A>, fallback?: (tag: Keys) => A): (variant: Union) => A {
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
