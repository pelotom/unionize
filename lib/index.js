"use strict";
export function unionize() {
    return unionizeCustom('tag', 'value');
}
export function unionizeCustom(tagProp, valProp) {
    var addCreators = function (obj) { return new Proxy(obj, {
        get: function (target, tag) { return tag in target
            ? target[tag]
            : function (value) {
                return (_a = {},
                    _a[tagProp] = tag,
                    _a[valProp] = value,
                    _a);
                var _a;
            }; },
    }); };
    var addPredicates = function (obj) { return new Proxy({}, {
        get: function (target, tag) { return tag in target
            ? target[tag]
            : function (variant) { return variant[tagProp] === tag; }; },
    }); };
    var is = addPredicates({});
    function match(cases, fallback) {
        return function (variant) {
            for (var k in cases) {
                if (is[k](variant)) {
                    return cases[k](variant[valProp]);
                }
            }
            if (fallback)
                return fallback(variant[tagProp]);
            // throw Error(`match failure: no handler for case ${variant[tagProp as any]}`)
            return undefined;
        };
    }
    return addCreators({
        _Tags: undefined,
        _Record: undefined,
        _Union: undefined,
        is: is,
        match: match,
    });
}
export default unionize;
//# sourceMappingURL=index.js.map