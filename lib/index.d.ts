export interface Variant<Tag, Value> {
    tag: Tag;
    value: Value;
}
export declare type CustomVariant<TagProp extends string, Tag, ValProp extends string, Value> = {
    [_ in TagProp]: Tag;
} & {
    [_ in ValProp]: Value;
};
export declare function unionize<Record, TaggedTable = {
    [T in keyof Record]: Variant<T, Record[T]>;
}>(): {
    _Tags: keyof TaggedTable;
    _Record: Record;
    _Union: TaggedTable[keyof TaggedTable];
    is: {
        [T in keyof TaggedTable]: (variant: TaggedTable[keyof TaggedTable]) => variant is TaggedTable[T];
    };
    match: {
        <A>(cases: {
            [T in keyof Record]: (value: Record[T]) => A;
        }): (variant: TaggedTable[keyof TaggedTable]) => A;
        <K extends keyof Record, A>(cases: {
            [T in K]: (value: Record[T]) => A;
        }, fallback: (tag: keyof Record) => A): (variant: TaggedTable[keyof TaggedTable]) => A;
    };
} & {
    [T in keyof Record]: (value: Record[T]) => TaggedTable[keyof TaggedTable];
};
export declare function unionizeCustom<Record, TagProp extends string, ValProp extends string, TaggedTable = {
    [T in keyof Record]: CustomVariant<TagProp, T, ValProp, Record[T]>;
}>(tagProp: TagProp, valProp: ValProp): {
    _Tags: keyof TaggedTable;
    _Record: Record;
    _Union: TaggedTable[keyof TaggedTable];
    is: {
        [T in keyof TaggedTable]: (variant: TaggedTable[keyof TaggedTable]) => variant is TaggedTable[T];
    };
    match: {
        <A>(cases: {
            [T in keyof Record]: (value: Record[T]) => A;
        }): (variant: TaggedTable[keyof TaggedTable]) => A;
        <K extends keyof Record, A>(cases: {
            [T in K]: (value: Record[T]) => A;
        }, fallback: (tag: keyof Record) => A): (variant: TaggedTable[keyof TaggedTable]) => A;
    };
} & {
    [T in keyof Record]: (value: Record[T]) => TaggedTable[keyof TaggedTable];
};
export default unionize;
