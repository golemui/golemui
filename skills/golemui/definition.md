# GolemUI — the form definition

What a JSON form definition holds: its shape, the widgets, states, layouts, text and the submit
button. Validators are in [validators.md](validators.md), events in [events.md](events.md), and
how the definition reaches the form component in [hosts/config.md](hosts/config.md).

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
      "type": "checkbox",
      "path": "hasDiscountCode",
      "label": "I have a discount code"
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

- The document has `form`, the array of widgets, and optionally `states`, a map from a state
  name to a reactive expression. `states` is a sibling of `form`, inside the document.
- `$schema` lets an editor validate the file as it is written.

## Widgets

Every widget has a `kind` (`input`, `action`, `display` or `layout`) and a `type`, the exact
widget name, case-sensitive: `textinput`, `datePicker`, `radiogroup`. An input also has a
`path`, the key of its value in the form data.

The keys a widget takes at its top level are few, and the same for every widget that has them:
`uid`, `path`, `label`, `validator`, `defaultValue`, `disabled`, `readonly`, `include`,
`exclude`, `on` and `size`, plus `actionType` on a button and `children` on a layout. Every
other option of a widget (`items`, `options`, `placeholder`, `hint`, `minDate`, …) is under
`props`.

Each widget's options are on its docs page, listed in [widgets-index.md](widgets-index.md). With
the MCP, `json_get_widget_spec({ "widgetType": "dropdown" })` returns the same as JSON.

## States and conditions

- `include` shows a widget only in some states, `{ "in": ["stateName"] }`, or while an
  expression is true, `{ "when": "$form.country === 'ES'" }`.
- `exclude` hides it in some states, `{ "from": ["stateName"] }`, or while an expression is
  true, `{ "when": "…" }`.
- `disabled` and `readonly` take `true`, `false` or `{ "when": "…" }`.
- Expressions read `$form` (the data), `$meta`, `$errors` and `$formIsInvalid`.

States: https://golemui.com/json/features/states/index.md · per-state properties:
https://golemui.com/json/features/states/properties.md

## Layouts

A layout (`"kind": "layout"`, type `grid`, `tabs` or `accordion`) holds a `children` array of
widgets. A `grid` stacks its children by default. Its options are under `props`:
`"direction": "row"` puts the children on one line, `"columns"` wraps them into columns, and
`"gap"` is a step: `"none"`, `"xs"`, `"sm"`, `"md"`, `"lg"` or `"xl"`.

```json
{
  "kind": "layout",
  "type": "grid",
  "props": { "direction": "row", "gap": "sm" },
  "children": [
    { "kind": "input", "type": "textinput", "path": "firstName", "label": "First name" },
    { "kind": "input", "type": "textinput", "path": "lastName", "label": "Last name" }
  ]
}
```

The `flex` layout is deprecated (see `never-generate-flex`).

## Headings and text

A form has two display widgets for text:

- `markdownText` renders markdown: a heading, a paragraph, a list. The markdown goes in
  `props.md`. It needs a markdown parser on the form component, in `dependencies.markdown`
  ([host-services.md](host-services.md)).
- `alert` shows a message box: `props.text` and `props.level`.

```json
{ "kind": "display", "type": "markdownText", "props": { "md": "## Shipping address" } }
```

The `markdown` widget is an input: an editor whose value is the markdown the user types (see
`text-is-a-markdowntext-display`).

## Key docs

- Form Definition API overview: https://golemui.com/json/form-definition/overview.md
- How resolution works: https://golemui.com/json/form-definition/how-it-works.md
- States: https://golemui.com/json/form-definition/states.md
- Runtime functions: https://golemui.com/json/form-definition/runtime-functions.md
- Tags: https://golemui.com/json/form-definition/tags.md
- Custom widgets in definitions: https://golemui.com/json/form-definition/custom-widgets.md

## Rules

### rule: json-only-in-a-json-definition

When: writing a JSON form definition.

Do: write JSON widget objects only, in the shape of "Document shape".

Wrong:

- Doing: a `gui.*` call, or an option name taken from a `/dx/` docs page, inside the document.

  Because: GolemUI 3 has no `gui.*` builder, `@golemui/gui-shared` exports no `gui`; and an option written at the top level of a widget, as the `/dx/` pages show them, fails the validator: ``Unknown property `placeholder` at `/form/0` ``.

Applies: json-api

Source: libs/gui/shared/src/index.ts, libs/gui/mcp/src/json/errors.ts#formatError

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

Do: put the options of the widget under `props`; only the keys listed in "Widgets" go at its top level.

Wrong:

- Doing: `"placeholder": "you@example.com"` next to `"label"`.

  Because: the validator reports ``Unknown property `placeholder` at `/form/0` ``.

- Doing: `"gap": "md"` or `"direction": "row"` next to the `"children"` of a `grid`.

  Because: the validator reports ``Unknown property `gap` at `/form/0` ``.

Applies: json-api, props, grid

Source: libs/gui/schemas/src/lib/core/common.schema.json, libs/gui/mcp/src/json/errors.ts#formatError

### rule: text-is-a-markdowntext-display

When: the form needs a heading or a block of text.

Do: use a `markdownText` display with the text in `props.md`, and give the form component a markdown parser.

Right:

```json
{ "kind": "display", "type": "markdownText", "props": { "md": "## Order summary" } }
```

Wrong:

- Doing: `{ "kind": "input", "type": "markdown", "path": "title" }` for a heading.

  Because: `markdown` is an editor: it renders a toolbar and a text area, and its value is the text the user types.

- Doing: a `markdownText` with no parser on the form component.

  Because: the widget renders empty, with no error.

Applies: json-api, markdownText, markdown, display

Source: libs/gui/schemas/src/lib/components/markdowntext.schema.json, libs/gui/schemas/src/lib/components/markdown.schema.json

### rule: submit-is-a-button-with-action-type

When: adding a submit button.

Do: write a `button` action with `"actionType": "submit"`.

Right:

```json
{ "kind": "action", "type": "button", "label": "Sign up", "actionType": "submit" }
```

Wrong:

- Doing: `{ "kind": "action", "type": "submit", "label": "Sign up" }`

  Because: there is no `submit` widget. The validator takes it for a custom widget and passes it with a warning, and the form fails to start: `[30] Widget "submit" could not be loaded`.

Applies: json-api, button

Source: libs/gui/schemas/src/lib/components/button.schema.json, libs/gui/mcp/src/json/errors.ts#collectWidgetErrors, libs/core/src/lib/errors.ts#errorCodes

### rule: gap-is-a-step

When: setting the `gap` of a `grid` layout.

Do: put it under `props`, as a step: `"props": { "gap": "md" }`.

Wrong:

- Doing: a number, `"props": { "gap": 16 }`.

  Because: the validator reports ``Value 16 at `/form/0/props/gap` is not one of the allowed values``.

Applies: json-api, grid

Source: libs/gui/schemas/src/lib/components/grid.schema.json, libs/gui/mcp/src/json/errors.ts#formatError

### rule: never-generate-flex

When: laying widgets out.

Do: use a `grid` layout, with `"props": { "direction": "row" }` to put its children on one line.

Wrong:

- Doing: a layout of type `flex`.

  Because: `flex` is deprecated; its schema says so, although the validator accepts it.

Applies: json-api, grid, flex

Source: libs/gui/schemas/src/lib/components/flex.schema.json
