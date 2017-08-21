# Unionize

Define unions via records for great good!

```ts
import unionize from 'unionize'

const Action = unionize<{
  ADD_TODO: { id: string; text: string }
  SET_VISIBILITY_FILTER: 'SHOW_ALL' | 'SHOW_ACTIVE' | 'SHOW_COMPLETED'
  TOGGLE_TODO: { id: string }
}>();

// Turns the above into a union type
type Action = typeof Action._Union;

// Match expressions
const todosReducer = (state: Todo[] = [], action: Action) => Action.match(
  { // handle cases as pure functions
    ADD_TODO: ({ id, text }) => [
      ...state,
      { id, text, completed: false }
    ],
    TOGGLE_TODO: ({ id }) => state.map(todo =>
      todo.id === id
        ? {...todo, completed: !todo.completed}
        : todo
    ),
  },
  // default; if not provided the above cases will be statically checked
  // for exhaustiveness
  () => state
)(action);

// Variant predicates
(action$: Observable<Action>) => action$
  .filter(Action.is.TOGGLE)
  // The type of the resulting observable is refined appropriately...
  .mergeMap(({ text }) => /*...*/)
```
