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
function getTodoId(action: Action): string {
  return Action.match(
    { // case analysis
      ADD_TODO: ({ id }) => id,
      TOGGLE_TODO: ({ id }) => id,
    },

    // default; if not provided the above cases will be typechecked
    // for exhaustiveness
    type => { throw Error(`action type ${type} has no associated id`) }
  );

// Variant predicates
(action$: Observable<Action>) => action$
  .filter(Action.is.TOGGLE)
  // The type of the resulting observable is refined appropriately...
  .mergeMap(({ text }) => /*...*/)
```
