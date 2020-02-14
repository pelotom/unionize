export type Unionized<Record, TaggedRecord, TagProp extends string> = UnionTypes<
  Record,
  TaggedRecord
> &
  Creators<Record, TaggedRecord, TagProp> &
  UnionExtensions<Record, TaggedRecord>;

export interface UnionTypes<Record, TaggedRecord> {
  _TaggedRecord: TaggedRecord;
  _Tags: keyof TaggedRecord;
  _Record: Record;
  _Union: TaggedRecord[keyof TaggedRecord];
}
export interface UnionExtensions<Record, TaggedRecord> {
  is: Predicates<TaggedRecord>;
  as: Casts<Record, TaggedRecord[keyof TaggedRecord]>;
  match: Match<Record, TaggedRecord[keyof TaggedRecord]>;
  transform: Transform<Record, TaggedRecord[keyof TaggedRecord]>;
}

export type TaggedRecordOf<U extends UnionTypes<any, any>> = U['_TaggedRecord'];
export type TagsOf<U extends UnionTypes<any, any>> = U['_Tags'];
export type RecordOf<U extends UnionTypes<any, any>> = U['_Record'];
export type UnionOf<U extends UnionTypes<any, any>> = U['_Union'];

export type Creators<Record, TaggedRecord, TagProp extends string> = {
  [T in keyof Record]: {} extends Required<Record[T]>
    ? ((value?: {}) => TaggedRecord[keyof TaggedRecord])
    : ((value: Record[T]) => TaggedRecord[keyof TaggedRecord])
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

export interface Match<Record, Union> {
  <A>(cases: MatchCases<Record, Union, A>): (variant: Union) => A;
  <A>(variant: Union, cases: MatchCases<Record, Union, A>): A;
}

export type TransformCases<Record, Union> = Partial<
  { [T in keyof Record]: (value: Record[T]) => Union }
>;

export interface Transform<Record, Union> {
  (cases: TransformCases<Record, Union>): (variant: Union) => Union;
  (variant: Union, cases: TransformCases<Record, Union>): Union;
}

export type MultiValueVariants<Record extends MultiValueRec<TagProp>, TagProp extends string> = {
  [T in keyof Record]: Record[T] extends { [_ in TagProp]: T } // does record already has tag with correct value?
    ? Record[T] // yes: return as is
    : { [_ in TagProp]: T } & Record[T] // no: decorate with tag
};

export type SingleValueVariants<
  Record extends SingleValueRec,
  TagProp extends string,
  ValProp extends string
> = { [T in keyof Record]: { [_ in TagProp]: T } & { [_ in ValProp]: Record[T] } };

// Forbid usage of default property; reserved for pattern matching.
export interface NoDefaultProp {
  default?: never;
}

export type SingleValueRec = NoDefaultRec<{} | null>;
export type MultiValueRec<TagProp extends string> = NoDefaultRec<
  { [tag: string]: any } & { [tag in TagProp]?: never }
>;
export type NoDefaultRec<Val> = {
  [k: string]: Val;
} & NoDefaultProp;

/**
 * Create a tagged union from a record mapping tags to value types, along with associated
 * variant constructors, type predicates and `match` function.
 *
 * @param record A record mapping tags to value types. The actual values of the record don't
 * matter; they're just used in the types of the resulting tagged union. See `ofType`.
 * @param config An optional config object. By default tag='tag' and value is merged into object itself
 * @param config.tag An optional custom name for the tag property of the union.
 * @param config.value An optional custom name for the value property of the union. If not specified,
 * the value must be a dictionary type.
 */

export function unionize<
  Record extends SingleValueRec,
  ValProp extends string,
  TagProp extends string = 'tag'
>(
  record: Record,
  config: { value: ValProp; tag?: TagProp },
): Unionized<Record, SingleValueVariants<Record, TagProp, ValProp>, TagProp>;
export function unionize<Record extends MultiValueRec<TagProp>, TagProp extends string = 'tag'>(
  record: Record,
  config?: { tag: TagProp },
): Unionized<Record, MultiValueVariants<Record, TagProp>, TagProp>;
export function unionize<Record>(record: Record, config?: { value?: string; tag?: string }) {
  const { value: valProp = undefined, tag: tagProp = 'tag' } = config || {};

  const creators = {} as Creators<Record, any, any>;
  for (const tag in record) {
    creators[tag] = ((value: any = {}) =>
      valProp ? { [tagProp]: tag, [valProp]: value } : { ...value, [tagProp]: tag }) as any;
  }

  const is = {} as Predicates<any>;
  for (const tag in record) {
    is[tag] = ((variant: any) => variant[tagProp] === tag) as any;
  }

  function evalMatch(variant: any, cases: any, defaultCase = cases.default): any {
    const handler = cases[variant[tagProp]];
    return handler ? handler(valProp ? variant[valProp] : variant) : defaultCase(variant);
  }

  const match = (first: any, second?: any) =>
    second ? evalMatch(first, second) : (variant: any) => evalMatch(variant, first);

  const identity = <A>(x: A) => x;
  const transform = (first: any, second?: any) =>
    second
      ? evalMatch(first, second, identity)
      : (variant: any) => evalMatch(variant, first, identity);

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
      transform,
      _Record: record,
    },
    creators,
  );
}

/**
 * Creates a pseudo-witness of a given type. That is, it pretends to return a value of
 * type `T` for any `T`, but it's really just returning `undefined`. This white lie
 * allows convenient expression of the value types in the record you pass to `unionize`.
 */
export const ofType = <T>() => (undefined as any) as T;

export default unionize;
