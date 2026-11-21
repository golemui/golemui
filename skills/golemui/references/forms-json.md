# GolemUI — JSON form definitions

The JSON API is the serializable twin of the `gui.*` TS API: both produce the same definition.
Use JSON when forms are stored, transferred, diffed, generated, or served from a backend.
All docs for this flavor live under `https://golemui.com/json/<page>.md`.

Setup:

```ts
type Source = Parameters<typeof import('@golemui/gui-shared').toJsonFormDefinition>[0];
declare const formDef: Source['formDef'];
declare const formSelectors: Source['formSelectors'];
declare const formConfig: Source['formConfig'];
```

## Document shape

```json
{
  "$schema": "https://golemui.com/schemas/form.schema.json",
  "states": {
    "hasDiscount": "$form.hasDiscountCode === true"
  },
  "form": [
    {
      "kind": "input",
      "type": "textinput",
      "path": "fullName",
      "label": "Full name",
      "validator": { "type": "string", "required": true, "minLength": 2 }
    },
    {
      "kind": "input",
      "type": "textinput",
      "path": "discountCode",
      "label": "Discount code",
      "include": { "in": ["hasDiscount"] }
    },
    { "kind": "action", "type": "button", "label": "Submit", "actionType": "submit" }
  ]
}
```

- Top level: `form` (required widget array), optional `states` (name → reactive expression
  string). Here `states` is a sibling of `form` inside the document (in the TS API, states live
  in a separate `formConfig` object).
- Every widget: `kind` (`input` | `action` | `display` | `layout`) + `type` (the exact widget
  name, case-sensitive, e.g. `textinput`, `datePicker`, `radiogroup`) + for inputs a `path` (the
  data key).
- `label`, `validator`, `include`/`exclude`, and `on` (event handler names) are top-level widget
  keys. Widget-specific options (`items`, `options`, `placeholder`, `minDate`, …) are under
  `props`.
- Layouts (`"kind": "layout"`, types `grid`/`tabs`/`accordion`) hold a `children` array
  of widgets. A `grid` stacks them by default. Its options go under `props`, like any widget's:
  `"direction": "row"` puts the children on one line, `"columns"` wraps them, and `"gap"` is a
  step (`"none"`, `"xs"`, `"sm"`, `"md"`, `"lg"`, `"xl"`).
- A validator has a `"type"` (`string`, `number`, `boolean`, `array`), rules, and optional
  per-rule `messages` (rule name → text). The default messages are developer-facing.
- Event handlers are names (`"on": { "load": "loadCars" }`) resolved against host functions
  registered on the form component:
  https://golemui.com/json/features/host-functions.md

## How validation behaves

Three behaviours that the rules below come from:

- **A boolean and `required`.** `false` is a valid boolean, so `"required": true` does not
  force a checkbox to be checked. `"const": true` rejects `false`, but alone it lets the
  pristine `undefined` pass, because a validator that is not required is optional.
- **A missing value and its message.** An `undefined` or `null` value (a pristine or cleared
  field) fails the base type check, and shows the `invalid` message, not the `required` one.
  Only string and array validators have a `required` message key; for number and boolean,
  `invalid` is the only message for a missing value.
- **A pristine form.** Validation never runs at mount, so `$formIsInvalid` starts `false`.
  The runtime still blocks the actual submit while the form is invalid, so this is a UX
  concern, not one of data integrity.

With the MCP available, `get_concept({ "concept": "validation" })` returns the full guide.

## Validating a definition

Definitions validate against published JSON Schemas: entry point
`https://golemui.com/schemas/form.schema.json` (packaged as `@golemui/gui-schemas`).

- With the GolemUI MCP: `json_validate_form_definition`. `errors` are to fix; `warnings`
  (likely-custom widgets), `expressionWarnings` (linted reactive expressions) and
  `interpolationWarnings` (linted `{{ … }}` interpolations in strings) are advisory.
- Without the MCP, the same check from the shell:
  `npx -y @golemui/gui-mcp validate-json <file.json>` (exit 0 = valid, 1 = the reported errors
  are to fix; see [mcp.md](mcp.md)).

## Generating from an existing schema

With the MCP: `json_generate_from_schema` maps a JSON Schema (e.g. Zod-derived) to a validated
form; `json_generate_from_openapi` resolves an OpenAPI 3.x operation (`"POST /users"` or an
operationId) and builds the form from its request body. Both return `diagnostics` and an
`unmapped` list. `if/then/else`, `dependentRequired` and discriminated `oneOf` become
`include.when` conditions and form `states`. Optional `rules` and `overrides` choose other
widgets. Walkthrough: https://golemui.com/json/mcp/generating-from-a-schema.md

Without the MCP, the same converter runs in code or from the command line:

- At runtime: `fromJsonSchema(schema, { preset: guiPreset() })` from
  `@golemui/schemas/json-schema` and `@golemui/gui-schemas/json-schema` returns
  `{ formDefinition, diagnostics }`.
- As a file: `npx @golemui/schemas convert schema.json --preset @golemui/gui-schemas/json-schema --out form.json`
  writes the form definition, and does not replace an existing file without `--force`.

## Converting a `gui.*` form to JSON

`toJsonFormDefinition` from `@golemui/gui-shared` converts a form written with the TS API to a
JSON definition. It runs the builder, so the JSON holds what the selectors, the automatic labels
and the automatic placeholders add:

```ts
import { toJsonFormDefinition } from '@golemui/gui-shared';

const { formDefinition, diagnostics } = toJsonFormDefinition({
  formDef,
  formSelectors,
  formConfig,
});
```

- `formDefinition` is the JSON document.
- `diagnostics` lists what JSON cannot hold, each with a JSON Pointer into the document:
  - An event handler that is a function. The JSON holds an event name such as `save_click`,
    handled in the `formEvent` handler of the form component.
  - A widget that is a callback. The JSON holds the result of one call with an empty form.
  - A display widget that is a render function. It is left out.
  - The `functions`, `dependencies`, `validateOn`, `itemRenderers` and `widgetLoaders` of
    `formConfig`. A JSON form has no `formConfig`: they go in the config of the form component
    (`widgetLoaders` as `customWidgetLoaders`).

## Key docs (fetch as needed)

- Form Definition API overview: https://golemui.com/json/form-definition/overview.md
- How resolution works: https://golemui.com/json/form-definition/how-it-works.md
- States: https://golemui.com/json/form-definition/states.md and
  https://golemui.com/json/features/states/index.md
- Events: https://golemui.com/json/form-definition/events.md
- Runtime functions: https://golemui.com/json/form-definition/runtime-functions.md
- Tags: https://golemui.com/json/form-definition/tags.md
- Custom widgets in definitions: https://golemui.com/json/form-definition/custom-widgets.md
- Per-widget JSON shapes: see [widgets-index.md](widgets-index.md) (use the `json` URLs)

## Rules

### rule: json-only-in-a-json-definition

When: writing a JSON form definition.

Do: write JSON widget objects only, in the shape of "Document shape".

Wrong:

- Doing: a `gui.*` call, or an option name taken from a `/dx/` docs page, inside the document.

  Because: the two APIs have different shapes; never mix JSON shapes with `gui.*` syntax in one artifact.

Applies: json-api

Source: libs/dx/src/lib/resolveFormInput.ts#isDxDefinitions

### rule: keep-the-schema-key

When: writing a JSON definition to a file.

Do: keep the `"$schema": "https://golemui.com/schemas/form.schema.json"` key at the top of the document.

Wrong:

- Doing: leaving `$schema` out of an authored file.

  Because: editors validate the file live only with it.

Applies: json-api, validation

Source: libs/gui/mcp/src/shared/form-schema-url.ts#FORM_SCHEMA_URL, libs/schemas/site/form.schema.json

### rule: widget-options-under-props

When: setting an option of a widget in JSON.

Do: put widget-specific options (`items`, `options`, `placeholder`, `minDate`, …) under `props`, and only `label`, `validator`, `include`/`exclude` and `on` at the top level of the widget.

Wrong:

- Doing: `"placeholder": "you@example.com"` next to `"label"`.

  Because: `placeholder` is a widget-specific option, and the validator reports an unknown property.

Applies: json-api, props

Source: libs/gui/schemas/src/lib/core/common.schema.json

### rule: json-validator-carries-type

When: writing a `validator` in JSON.

Do: give it an explicit `"type"`: `string`, `number`, `boolean` or `array`.

Even when: the widget is a plain text input. This differs from the TS API, where most widgets take a validator with no `type`.

Wrong:

- Doing: a validator with no `type`, `"validator": { "required": true }`.

  Because: the validator reports ``Value null at `/form/0/validator/type` is not one of the allowed values``.

Applies: json-api, validators

Source: libs/gui/schemas/src/lib/validators.schema.json

### rule: mandatory-checkbox-required-and-const

When: a checkbox must be checked for the form to be valid, such as accepting terms.

Do: use both: `"validator": { "type": "boolean", "required": true, "const": true }`.

Wrong:

- Doing: only `required`, `"validator": { "type": "boolean", "required": true }`.

  Because: `false` is a valid boolean, so an unchecked box passes.

- Doing: only `const`, `"validator": { "type": "boolean", "const": true }`.

  Because: the pristine `undefined` passes, since a validator that is not required is optional.

Applies: json-api, validators, checkbox

Source: libs/gui/validators/src/lib/validators.ts#BooleanValidator, libs/gui/validators/src/lib/validators.ts#fromBooleanValidator

### rule: required-needs-an-invalid-message

When: a validator of a production form has `"required": true`.

Do: set `"messages"` with an `invalid` text. For string and array validators set `required` too, with the same text; for a mandatory checkbox pair `invalid` with `const` the same way.

Even when: a `required` message is already set.

Wrong:

- Doing: `"messages": { "required": "Enter your email" }` and no `invalid`.

  Because: a pristine or cleared field is `undefined`, fails the base type check, and shows the default `invalid` message, which is developer-facing.

Applies: json-api, validators, messages

Source: libs/gui/validators/src/lib/validators.ts#fromStringValidator, libs/gui/validators/src/lib/validators.ts#fromNumberValidator, libs/gui/validators/src/lib/validators.ts#fromBooleanValidator, libs/gui/validators/src/lib/validators.ts#fromArrayValidator, libs/gui/validators/src/lib/validators.ts#resolveMessage

### rule: custom-messages-on-production-forms

When: writing validators for a production form.

Do: add a `"messages"` map, rule name → text.

Wrong:

- Doing: leaving the default messages.

  Because: the defaults are developer-facing.

Applies: json-api, validators, messages

Source: libs/gui/validators/src/lib/validators.ts#resolveMessage

### rule: disabled-submit-also-checks-the-data

When: disabling the submit button while the form is invalid.

Do: write a compound expression that also checks the data, such as `"disabled": { "when": "$formIsInvalid || $form.email === undefined" }`.

Wrong:

- Doing: the flag alone, `"disabled": { "when": "$formIsInvalid" }`.

  Because: validation never runs at mount, so `$formIsInvalid` starts `false` and the button is enabled while required fields are still empty.

Applies: json-api, button, validation

Source: libs/core/src/lib/utils/form.ts#calculateValidationVariables

### rule: gap-is-a-step

When: setting the `gap` of a `grid` layout.

Do: put it under `props`, as a step: `"props": { "gap": "md" }`. The steps are `"none"`, `"xs"`, `"sm"`, `"md"`, `"lg"` and `"xl"`.

Wrong:

- Doing: a number, `"props": { "gap": 16 }`.

  Because: the validator reports ``Value 16 at `/form/0/props/gap` is not one of the allowed values``.

- Doing: `"gap": "md"` next to `"children"`, outside `props`.

  Because: the validator reports ``Unknown property `gap` at `/form/0` ``.

Applies: json-api, grid

Source: libs/gui/schemas/src/lib/components/grid.schema.json

### rule: never-generate-flex

When: laying widgets out.

Do: use a `grid` layout, with `"props": { "direction": "row" }` to put its children on one line.

Wrong:

- Doing: a layout of type `flex`.

  Because: `flex` is deprecated.

Applies: json-api, grid

Source: libs/gui/schemas/src/lib/components/flex.schema.json

### rule: handlers-are-names

When: a widget in a JSON definition reacts to an event.

Do: write the name of a host function under `on`, such as `"on": { "load": "loadCars" }`, and register that function on the form component.

Wrong:

- Doing: writing a function body or an expression as the handler.

  Because: JSON holds only the name; it is resolved against the host functions of the form component.

Applies: json-api, events, host-functions

Source: libs/gui/schemas/src/lib/core/common.schema.json

### rule: validate-json-until-valid

When: a JSON definition is written.

Do: finish by validating it, with `json_validate_form_definition` or with `npx -y @golemui/gui-mcp validate-json <file.json>` from "Validating a definition"; fix the `errors` and validate again until `valid: true`.

Even when: the definition was produced by `toJsonFormDefinition`.

Wrong:

- Doing: treating `warnings`, `expressionWarnings` or `interpolationWarnings` as errors to remove.

  Because: they do not change `valid`: a definition with warnings and no `errors` validates as `"valid": true`.

Applies: json-api, validation, mcp

Source: libs/gui/mcp/src/cli-commands.ts#runCli, libs/gui/mcp/src/json/validate-form-definition.ts#JSON_VALIDATE_FORM_DEFINITION_TOOL, libs/gui/mcp/src/json/validate-core.ts#ValidateResult

### rule: surface-what-was-not-mapped

When: a form was generated from a JSON Schema or an OpenAPI operation.

Do: tell the user what is in `diagnostics` and in the `unmapped` list.

Wrong:

- Doing: presenting the generated form and saying nothing of the fields left over.

  Because: the user takes the form for complete.

Applies: json-api, generation, mcp

Source: libs/gui/mcp/src/json/generate-from-json-schema.ts#generateFromJsonSchema, libs/gui/mcp/src/json/generate-from-openapi.ts#generateFromOpenapi
