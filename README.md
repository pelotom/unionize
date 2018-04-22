# Unionize [![Build Status](https://travis-ci.org/pelotom/unionize.svg?branch=master)](https://travis-ci.org/pelotom/unionize) [![Coverage Status](https://coveralls.io/repos/github/pelotom/unionize/badge.svg?branch=master)](https://coveralls.io/github/pelotom/unionize?branch=master)

Define unions via records for great good!

## Installation

```
yarn add unionize
```

## Example

Call `unionize` on a record literal mapping tag literals to value types:
```ts
import { unionize, ofType } from 'unionize'

// Define a record mapping tag literals to value types
const Action = unionize({
  ADD_TODO: ofType<{ id: string; text: string }>(),
  SET_VISIBILITY_FILTER: ofType<'SHOW_ALL' | 'SHOW_ACTIVE' | 'SHOW_COMPLETED'>(),
  TOGGLE_TODO: ofType<{ id: string }>(),
  CLEAR_TODOS: {}, // For "empty" types, just use {}
},
  // optionally override tag and/or value property names
  {
    tag:'type',
    value:'payload',
  }
);
```

Extract the inferred tagged union:
```ts
type Action = typeof Action._Union;
```

The inferred type is
```ts
type Action =
  | { type: ADD_TODO; payload: { id: string; text: string } }
  | { type: SET_VISIBILITY_FILTER; payload: 'SHOW_ALL' | 'SHOW_ACTIVE' | 'SHOW_COMPLETED' }
  | { type: TOGGLE_TODO; payload: { id: string } }
  | { type: CLEAR_TODOS; payload: {} }
```

Having done that, you now have at your disposal:

#### Element factories

```ts
store.dispatch(Action.ADD_TODO({ id: 'c819bbc1', text: 'Take out the trash' }));
store.dispatch(Action.SET_VISIBILITY_FILTER('SHOW_COMPLETED'));
store.dispatch(Action.CLEAR_TODOS()); // no argument required if value type is {}
```

#### Match expressions

```ts
const todosReducer = (state: Todo[] = [], action: Action) =>
  Action.match(action, {
    // handle cases as pure functions instead of switch statements
    ADD_TODO: ({ id, text }) => [...state, { id, text, completed: false }],
    TOGGLE_TODO: ({ id }) =>
      state.map(todo => todo.id === id
        ? { ...todo, completed: !todo.completed }
        : todo
      ),
    // handles the rest; if not provided, cases must be exhaustive 
    default: a => state // a === action. Useful for curried version
  });
```

`action` can be omitted; in that case the result of match is a function:

```ts
const getIdFromAction = Action.match({
  ADD_TODO: ({ id}) => id,
  TOGGLE_TODO: ({ id }) => id,
  default: a => { throw new Error(`Action type ${a.type} does not have an associated id`); },
});

const action = Action.ADD_TODO({ id: 'c819bbc1', text: 'Take out the trash' });
const id = getIdFromAction(action); // id === 'c819bbc1'
```

#### Type guards

```ts
const epic = (action$: Observable<Action>) => action$
  .filter(Action.is.ADD_TODO)
  // The appropriately narrowed type of the resulting observable is inferred...
  .mergeMap(({ payload }) => console.log(payload.text))
```

#### Type casts

```ts
const { id, text } = Action.as.ADD_TODO(someAction) // throws if someAction is not an ADD_TODO
```

#### Transform expressions

`transform` is a shorthand alternative to `match` for when you are converting from the union type to itself, and only want to handle a subset of the cases, leaving the rest unchanged:

```ts
const Light = unionize({ On: ofType<{ percentage: number }>(), Off: {} });

const turnOn = Light.transform({ Off: () => Light.On({ percentage: 100 }) });
const dim = Light.transform({ On: prev => Light.On({ percentage: prev.percentage / 2 }) });

const off = Light.Off({});
const dimmed = dim(off); //didn't match. so dimmed === off
const on = turnOn(off);

// can accept an object right away
const toggled = Light.transform(on, {
  On: () => Light.Off({}),
  Off: () => Light.On({ percentage: 50 }),
});
```

#### Breaking changes from 1.0.1
**config object**

Now `unionize` accepts an optional config object instead of two additional arguments.

```ts
// before
unionize({...}, 'myTag', 'myPayloadProp');
unionize({...}, 'myTag');

// after
unionize({...}, { tag:'myTag', value:'myPayloadProp' });
unionize({...}, { tag:'myTag' });
unionize({...}, { value:'myPayloadProp' }); // <-- previously not possible
```

**`match`**

Whereas previously `match` was always curried, now it can alternatively accept the object to match as a first argument. Additionally, the default case is now expressed as just another property in the cases object.

```ts
// before
Light.match({
  On: () => 'is on'
}, () => 'is off'
)(light);

// after
Light.match({
  On: () => 'is on',
  default: () =>'is off'
})(light);
Light.match(light, {
  On: () => 'is on',
  default: () => 'is off',
});
```
