# Unionize

Define unions via records for great good!

```ts
import unionize from 'unionize'

// Define a record mapping tag literals to value types
const Action = unionize<{
  ADD_TODO: { id: string; text: string }
  SET_VISIBILITY_FILTER: 'SHOW_ALL' | 'SHOW_ACTIVE' | 'SHOW_COMPLETED'
  TOGGLE_TODO: { id: string }
}>()
  // Change the default tag and value properties as needed
  .withTagProperty('type')
  .withValueProperty('payload');

// Extract the inferred tagged union:
// type Action =
//   | { type: ADD_TODO; payload: { id: string; text: string } }
//   | { type: SET_VISIBILITY_FILTER; payload: 'SHOW_ALL' | 'SHOW_ACTIVE' | 'SHOW_COMPLETED' }
//   | { type: TOGGLE_TODO; payload: { id: string } }
type Action = typeof Action._Union;

interface Todo {
  id: string
  text: string
  completed: boolean
}

// Match and transform values of the union type
const todosReducer = (state: Todo[] = [], action: Action) => Action.match(
  { // handle cases as pure functions instead of switch statements
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
  // default; if not provided, cases will be typechecked for exhaustiveness
  () => state
)(action);

// Variant predicates
(action$: Observable<Action>) => action$
  .filter(Action.is.TOGGLE)
  // The type of the resulting observable is refined appropriately...
  .mergeMap(({ text }) => /*...*/)
```
