# GolemUI — converting a `gui.*` form to JSON

For a project that has forms written with the `gui.*` builder of GolemUI 2.x and moves them to
JSON definitions. GolemUI 3 has no `gui.*` builder, so the conversion runs on 2.3.0, before the
upgrade. Writing new `gui.*` code is outside this skill.

## toJsonFormDefinition

`toJsonFormDefinition` from `@golemui/gui-shared` 2.3.0 runs the builder and returns the JSON
definition, with what the selectors, the automatic labels and the automatic placeholders add.
GolemUI 3 removed it with the builder (see `convert-before-the-upgrade`):

```ts no-check
// @golemui/gui-shared 2.3.0
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
    `customWidgetLoaders`): GolemUI 3 has no `formConfig`.

The result is checked as any other definition: see `verify-before-presenting` in
[SKILL.md](SKILL.md).

## Rules

### rule: convert-before-the-upgrade

When: a project with `gui.*` forms is about to upgrade GolemUI to 3.

Do: convert each form with `toJsonFormDefinition` while the project is still on 2.3.0, then upgrade.

Wrong:

- Doing: upgrading first, then importing `toJsonFormDefinition`.

  Because: GolemUI 3 removed it; TypeScript reports that `@golemui/gui-shared` has no exported member `toJsonFormDefinition`.

Applies: migration, gui-shared

Source: libs/gui/shared/src/index.ts
