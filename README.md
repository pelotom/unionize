# Unionize [![Build Status](https://travis-ci.org/pelotom/unionize.svg?branch=master)](https://travis-ci.org/pelotom/unionize) [![Coverage Status](https://coveralls.io/repos/pelotom/unionize/badge.svg?branch=master)](https://coveralls.io/github/pelotom/unionize?branch=master)

Define unions via records for great good!

## Installation

```
yarn add unionize
```

## Example

Call `unionize` or `unionizeCustom` on a record literal mapping tag literals to value types:
```ts
import { unionize, ofType } from 'unionize'

// Define a record mapping tag literals to value types
const Action = unionize({
  ADD_TODO:                ofType<{ id: string; text: string }>(),
  SET_VISIBILITY_FILTER:   ofType<'SHOW_ALL' | 'SHOW_ACTIVE' | 'SHOW_COMPLETED'>(),
  TOGGLE_TODO:             ofType<{ id: string }>(),
}, 'type', 'payload'); // optionally override tag and value property names
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
const todosReducer = (state: Todo[] = [], action: Action) => Action.match({
  // handle cases as pure functions instead of switch statements
  ADD_TODO: ({ id, text }) => [
    ...state,
    { id, text, completed: false }
  ],
  TOGGLE_TODO: ({ id }) => state.map(todo =>
    todo.id === id
      ? {...todo, completed: !todo.completed}
      : todo
  )
}, () => state /* default; if not provided, cases must be exhaustive */)(action);
```

#### Type predicates

```ts
(action$: Observable<Action>) => action$
  .filter(Action.is.TOGGLE_TODO)
  // The type of the resulting observable is refined appropriately...
  .mergeMap(({ text }) => /*...*/)
```

#### Type casts

```ts
const { id, text } = Action.as.ADD_TODO(someAction) // throws if someAction is not an ADD_TODO
```
