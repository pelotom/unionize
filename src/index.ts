export type Unionized<Record, TaggedRecord> = {
  _Tags: keyof TaggedRecord;
  _Record: Record;
  _Union: TaggedRecord[keyof TaggedRecord]
  is: Predicates<TaggedRecord>
  as: Casts<Record, TaggedRecord>
  match: Match<Record, TaggedRecord>
} & Creators<Record, TaggedRecord>

export type Creators<Record, TaggedRecord> = {
  [T in keyof Record]: (value: Record[T]) => TaggedRecord[keyof TaggedRecord]
}

export type Predicates<TaggedRecord> = {
  [T in keyof TaggedRecord]: (variant: TaggedRecord[keyof TaggedRecord]) => variant is TaggedRecord[T]
}

export type Casts<Record, TaggedRecord> = {
  [T in keyof Record]: (variant: TaggedRecord[keyof TaggedRecord]) => Record[T]
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

export type MultiValueVariants<Record extends DictRecord, TagProp extends string> = {
  [T in keyof Record]: { [_ in TagProp]: T } & Record[T]
}

export type SingleValueVariants<Record, TagProp extends string, ValProp extends string> = {
  [T in keyof Record]: { [_ in TagProp]: T } & { [_ in ValProp]: Record[T] }
}

export type DictRecord = { [tag: string]: { [field: string]: any } }

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
export function unionize<Record extends DictRecord>(
  record: Record
): Unionized<Record, MultiValueVariants<Record, 'tag'>>
export function unionize<Record extends DictRecord, TagProp extends string>(
  record: Record,
  tagProp: TagProp,
): Unionized<Record, MultiValueVariants<Record, TagProp>>
export function unionize<Record, TagProp extends string, ValProp extends string>(
  record: Record,
  tagProp: TagProp,
  valProp: ValProp,
): Unionized<Record, SingleValueVariants<Record, TagProp, ValProp>>
export function unionize<Record>(record: Record, tagProp = 'tag', valProp?: string) {
  const creators = {} as Creators<Record, any>
  for (const tag in record) {
    creators[tag] = (value: any) => {
      if (valProp)
        return ({
          [tagProp as string]: tag,
          [valProp as string]: value,
        })

      return Object.assign({}, value, { [tagProp as string]: tag })
    }
  }

  const is = {} as Predicates<any>
  for (const tag in record) {
    is[tag] = ((variant: any) => variant[tagProp] === tag) as any
  }

  const as = {} as Casts<Record, any>
  for (const expectedTag in record) {
    as[expectedTag] = match(
      {
        [expectedTag]: (x: any) => x
      },
      actualTag => {
        throw new Error(`Attempted to cast ${actualTag} as ${expectedTag}`)
      }
    )
  }

  function match(cases: any, fallback?: (tag: string) => any): (variant: any) => any {
    return (variant: any) => {
      for (const k in cases)
        if (k in is && is[k](variant))
          return cases[k](valProp ? variant[valProp] : variant)

      if (fallback)
        return fallback(variant[tagProp])

      return undefined
    }
  }

  return Object.assign({
    is,
    as,
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
