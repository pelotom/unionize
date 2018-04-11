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
  ADD_TODO:                ofType<{ id: string; text: string }>(),
  SET_VISIBILITY_FILTER:   ofType<'SHOW_ALL' | 'SHOW_ACTIVE' | 'SHOW_COMPLETED'>(),
  TOGGLE_TODO:             ofType<{ id: string }>()
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
```

Having done that, you now have at your disposal:

#### Element factories

```ts
store.dispatch(Action.ADD_TODO({ id: 'c819bbc1', text: 'Take out the trash' }));
store.dispatch(Action.SET_VISIBILITY_FILTER('SHOW_COMPLETED'));
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
  default: a => undefined,
});

const action = Action.ADD_TODO({ id: 'c819bbc1', text: 'Take out the trash' });
const id = getIdFromAction(action); // id === 'c819bbc1'
```

#### Type predicates

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
`unionize` is great at modeling redux states as well.

```ts
const Light = unionize({ On: ofType<{ percentage: number }>(), Off: {} });
```
`transform` tries to find a match to produce a new state. Otherwise, simply returns the original object.

```ts
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

Overall, it is pretty similar to `match` but reduces boilerplate. Also note that `transform` requires you to return an object of the same type.

#### Breaking changes from 1.1
**config object**

Now unionize accepts an optional config object istead of two additional arguments.
```ts
//before
unionize({...}, 'myTag', 'myPayloadProp');

//now
unionize({...}, {tag:'myTag', value:'myPayloadProp'});
```

**default case for match**
```ts
//before
Light.match({On: () => 'is on'}, () =>'is off')

//now
Light.match({On: () => 'is on', default: () =>'is off'})
```

That allowed to introduce inline matching

```ts
const light = Light.Off({});

//before you had to pass an object using ().
Light.match({On: () => 'is on'}, () =>'is off')(light);

//now
Light.match(light, {On: () => 'is on', default: () =>'is off'})
```