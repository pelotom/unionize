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

export type Cases<Record, A> = {
  [T in keyof Record]: (value: Record[T]) => A
}

export type MatchCases<Record, TaggedRecord, A> =
  | Cases<Record, A>
  | (Partial<Cases<Record, A>> &
    {default: (variant: TaggedRecord[keyof TaggedRecord]) => A})

export type Match<Record, TaggedRecord> = {
  <A>(
    cases: MatchCases<Record, TaggedRecord, A>
  ): (variant: TaggedRecord[keyof TaggedRecord]) => A
  <A>(
    variant: TaggedRecord[keyof TaggedRecord],
    cases: MatchCases<Record, TaggedRecord, A>
  ): A
}

export type MultiValueVariants<Record extends DictRecord, TagProp extends string> = {
  [T in keyof Record]: { [_ in TagProp]: T } & Record[T]
}

export type SingleValueVariants<Record, TagProp extends string, ValProp extends string> = {
  [T in keyof Record]: { [_ in TagProp]: T } & { [_ in ValProp]: Record[T] }
}

// forbid usage of default property. reserved for pattern matching
export type DictRecord = { [tag: string]: { [field: string]: any }} & {default?: never}

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
    creators[tag] = (value: any) =>
      valProp
        ? { [tagProp]: tag, [valProp]: value }
        : { ...value, [tagProp]: tag }
  }

  const is = {} as Predicates<any>
  for (const tag in record) {
    is[tag] = ((variant: any) => variant[tagProp] === tag) as any
  }

  const as = {} as Casts<Record, any>
  for (const expectedTag in record) {
    as[expectedTag] = match(
      {
        [expectedTag]: (x: any) => x,
        default: (val: any) => {
          throw new Error(`Attempted to cast ${val[tagProp]} as ${expectedTag}`)
        }
      }
    )
  }

  const evaluateMatch = (cases: any, variant: any): any => {
    const k = variant[tagProp]
    return k in cases
      ? cases[k](valProp ? variant[valProp] : variant)
      // here we can have '"undefined is not a function". Is it worth checking?
      // it is <impossible> to get in ts but totally fine in js land
      : cases.default(variant)
  }

  function match(...args: any[]): any {
    if (args.length == 1) {
      const [cases] = args;
      return (variant: any) => evaluateMatch(cases, variant)
    }
  
    const [variant, cases] = args;
    return evaluateMatch(cases, variant)
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
