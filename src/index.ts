export interface Variant<Tag, Value> {
  tag: Tag
  value: Value
}

export type CustomVariant<TagProp extends string, Tag, ValProp extends string, Value> =
  & { [_ in TagProp]: Tag }
  & { [_ in ValProp]: Value }

export function unionize<Record, TaggedTable = { [T in keyof Record]: Variant<T, Record[T]> }>() {
  return unionizeCustom<Record, 'tag', 'value', TaggedTable>('tag', 'value')
}

export function unionizeCustom<
  Record,
  TagProp extends string,
  ValProp extends string,
  TaggedTable = { [T in keyof Record]: CustomVariant<TagProp, T, ValProp, Record[T]> }
>(tagProp: TagProp, valProp: ValProp) {
  // Keys and Tags should always be the same as long as no one is overriding the default TaggedTable,
  // but they need to be tracked separately to keep the type system happy
  type Keys = keyof Record
  type Tags = keyof TaggedTable
  type Union = TaggedTable[Tags]

  type Creators = { [T in Keys]: (value: Record[T]) => Union }
  const addCreators = <O extends {}>(obj: O) => new Proxy(obj as any as O & Creators, {
    get: <T extends Keys>(target: any, tag: T) => tag in target
      ? target[tag]
      : (value: Record[T]) => ({
        [tagProp as string]: tag,
        [valProp as string]: value,
      }),
  })

  type Predicates = { [T in Tags]: (variant: Union) => variant is TaggedTable[T] }
  const addPredicates = <O extends {}>(obj: O) => new Proxy({} as any as O & Predicates, {
    get: <T extends Tags>(target: any, tag: T) => tag in target
      ? target[tag]
      : (variant: any) => variant[tagProp] === tag,
  })
  const is = addPredicates({})

  type Cases<K extends Keys, A> = {
    [T in K]: (value: Record[T]) => A
  }
  function match<A>(cases: Cases<Keys, A>): (variant: Union) => A
  function match<K extends Keys, A>(cases: Cases<K, A>, fallback: (tag: Keys) => A): (variant: Union) => A
  function match<K extends Keys, A>(cases: Cases<K, A>, fallback?: (tag: Keys) => A): (variant: Union) => A {
    return (variant: Union): A => {
      for (const k in cases) {
        if (is[k](variant)) {
          return cases[k](variant[valProp as any])
        }
      }

      if (fallback)
        return fallback(variant[tagProp as any])

      // throw Error(`match failure: no handler for case ${variant[tagProp as any]}`)
      return undefined as any as A
    }
  }

  return addCreators({
    _Tags: undefined as any as Tags,
    _Record: undefined as any as Record,
    _Union: undefined as any as Union,
    is,
    match,
  })
}

export default unionize
