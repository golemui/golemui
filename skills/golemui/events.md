# GolemUI — events

How a widget tells the application that something happened (a click, a change, a load), and
how the application answers: load options, change a prop, report an error. The submit event is
in [hosts/config.md](hosts/config.md).

## Names in the definition

A widget names its events under `on`. The keys are `load`, `click`, `change`, `filter` and
`blur`; each value is a name you choose:

```json
{
  "kind": "input",
  "type": "dropdown",
  "path": "country",
  "label": "Country",
  "on": { "change": "loadCities" },
  "props": { "items": ["Spain", "France"] }
}
```

A key may take a state suffix, `"click.review"`, which replaces the base handler while the
state `review` is active.

## The handler in the application

The form component sends every named event through one `formEvent` handler: a callback prop in
React, an output in Angular, an `@form-event` emit in Vue, a `formEvent` DOM event on
`<gui-form>` in Lit and vanilla JS. The handler matches on `event.name`:

| Field      | What it holds                                                              |
| ---------- | -------------------------------------------------------------------------- |
| `name`     | the name from `on`                                                         |
| `data`     | the form data when the event was sent                                      |
| `detail`   | what the widget adds to the event                                          |
| `row`      | inside a repeater, the row: `{ index, indexes, path }`; absent outside one |
| `callback` | sends an action back to the form                                           |

`callback` takes two actions:

- `{ type: 'OVERRIDE_WIDGET_PROP', payload: { path, prop, value } }` sets a prop of the widget
  at `path` (or `{ uid, prop, value }`): the options of a radio group, the items of a dropdown.
- `{ type: 'INJECT_VALIDATION_ISSUES', payload: { path, issues } }` shows errors on a field,
  for example from a server check.

```ts
import type { FormEvent } from '@golemui/core';

const CITIES: Record<string, string[]> = { Spain: ['Madrid', 'Seville'], France: ['Paris'] };

function handleFormEvent(event: FormEvent) {
  if (event.name === 'loadCities') {
    event.callback({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: { path: 'city', prop: 'options', value: CITIES[event.data['country']] ?? [] },
    });
  }
}
```

Docs: https://golemui.com/json/features/events.md and
https://golemui.com/json/form-definition/events.md

## Rules

### rule: handlers-are-names

When: a widget in a JSON definition reacts to an event.

Do: write a name under `on`, such as `"on": { "change": "loadCities" }`, and handle that name in the `formEvent` handler of the form component, matching on `event.name`.

Wrong:

- Doing: writing a function body or an expression as the handler, `"on": { "load": "() => loadCities()" }`.

  Because: the string is only the name of the event; the validator accepts it, and nothing runs it.

- Doing: passing the handler as a host function, in the `functions` of the config.

  Because: `functions` are the `$fn` functions of expressions; an `on` name reaches only the `formEvent` handler.

Applies: json-api, events, react, angular, vue, lit, vanilla

Source: libs/gui/schemas/src/lib/core/common.schema.json, libs/core/src/lib/shared.ts#FormEvent, libs/core/src/lib/shared.ts#EventHandlerCallback
