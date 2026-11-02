# Deprecations

Every deprecated API of the GolemUI packages: what to use instead, and the release that removes
it. The release notes and the migration guide of a major version are written from this file.

- A PR that deprecates an API adds its row here, in the same PR. The API's TSDoc gets a
  `@deprecated` tag that says what to use instead and, when it is set, the version that removes
  it. A JSON Schema property also gets `"deprecated": true`.
- A PR that removes an API deletes its row, and the major version's migration guide gets an entry.
- "Next release" means the deprecation is on `main` but not released yet. The release that ships
  it replaces those words with its version.

## Removed in v3.0.0

| API                                                                                      | Package                                       | Deprecated in | Use instead                                               | Why                                                                                                                                       |
| ---------------------------------------------------------------------------------------- | --------------------------------------------- | ------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `maxLength` prop of the textarea and the markdown editor                                 | `gui-shared` (`TextareaProps`), `gui-schemas` | Next release  | `validator.maxLength`                                     | It has no effect. The validator drives the counter and the error.                                                                         |
| `limit` prop of the repeater                                                             | `gui-shared` (`RepeaterProps`), `gui-schemas` | Next release  | `validator.maxItems`                                      | It disables the add button with no message. The validator shows an error past the cap.                                                    |
| `localeId` property (`locale-id` attribute) of `gui-number`                              | `gui-components`                              | Next release  | Nothing                                                   | It has no effect: the inner `<input type="number">` formats and parses in the browser's locale.                                           |
| The flex layout: `type: 'flex'`, `gui.layouts.flex`, `horizontalFlex` and `verticalFlex` | `gui-shared`, `gui-schemas`                   | 2.1.0         | The grid layout: `grid`, `horizontalGrid`, `verticalGrid` | It renders as a grid. `FlexProps` (internals) and `FlexFamilyProps` go with it. The MCP server and the skill tell agents never to use it. |
| `autoFit`, `columnGap`, `rowGap` and `align` props of the grid layout                    | `gui-shared`, `gui-schemas`                   | 2.1.0         | `columns`, `gap`, `gap`, `justify`                        | Pixel gaps map to the nearest `GridGap` step.                                                                                             |

## No removal version yet

These still work, and no release is set to remove them yet.

| API                            | Package                     | Deprecated in | Use instead                                | Notes                                              |
| ------------------------------ | --------------------------- | ------------- | ------------------------------------------ | -------------------------------------------------- |
| `WidgetItemDecorator` type     | `dx` (public)               | Unknown       | `DxCommonFields` with the kind's base type | Kept as an alias for the pipeline internals.       |
| `DataInputDecorator` interface | `gui-shared` (not exported) | Unknown       | The individual input decorator types       | Not exported, so it can be removed in any release. |
