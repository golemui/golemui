# GolemUI — converting a `gui.*` form to JSON

For a project that has forms written with the `gui.*` builder of GolemUI 2.x and moves them to
JSON definitions. Writing new `gui.*` code is outside this skill.

Setup:

```ts
type Source = Parameters<typeof import('@golemui/gui-shared').toJsonFormDefinition>[0];
declare const formDef: Source['formDef'];
declare const formSelectors: Source['formSelectors'];
declare const formConfig: Source['formConfig'];
```

## toJsonFormDefinition

`toJsonFormDefinition` from `@golemui/gui-shared` runs the builder and returns the JSON
definition, with what the selectors, the automatic labels and the automatic placeholders add:

```ts
import { toJsonFormDefinition } from '@golemui/gui-shared';

const { formDefinition, diagnostics } = toJsonFormDefinition({
  formDef,
  formSelectors,
  formConfig,
});
```

- `formDefinition` is the JSON document. It goes into `formDef` whole
  ([hosts/config.md](hosts/config.md)).
- `diagnostics` lists what JSON cannot hold, each with a JSON Pointer into the document:
  - An event handler that is a function. The JSON holds an event name such as `save_click`,
    handled in the `formEvent` handler of the form component ([events.md](events.md)).
  - A widget that is a callback. The JSON holds the result of one call with an empty form.
  - A display widget that is a render function. It is left out. Text in JSON is a
    `markdownText` display ([definition.md](definition.md)).
  - The `functions`, `dependencies`, `validateOn`, `itemRenderers` and `widgetLoaders` of
    `formConfig`. They go at the top level of the component's config (`widgetLoaders` as
    `customWidgetLoaders`), because a JSON definition ignores `formConfig`.

The result is checked as any other definition: see `verify-before-presenting` in
[SKILL.md](SKILL.md).
