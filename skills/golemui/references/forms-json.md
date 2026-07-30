# GolemUI — JSON form definitions

The JSON API is the serializable twin of the `gui.*` TS API: both produce the same definition.
Use JSON when forms are stored, transferred, diffed, generated, or served from a backend.
All docs for this flavor live under `https://golemui.com/json/<page>.md` — never mix JSON
shapes with `gui.*` syntax in one artifact.

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
  string) — here `states` IS a sibling of `form` inside the document (unlike the TS API, where
  states live in a separate `formConfig` object).
- Every widget: `kind` (`input` | `action` | `display` | `layout`) + `type` (lowercase widget
  name, e.g. `textinput`, `datepicker`, `radiogroup`) + for inputs a `path` (the data key).
- `label`, `validator`, `include`/`exclude`, and `on` (event handler names) are top-level widget
  keys; widget-specific options (`items`, `options`, `placeholder`, `minDate`, …) go under
  `props`.
- Layouts (`"kind": "layout"`, types `flex`/`grid`/`tabs`/`accordion`) hold a `children` array
  of widgets.
- Validators in JSON always carry an explicit `"type"` (`string`, `number`, `boolean`, `array`)
  plus rules and optional per-rule `messages`.
- Event handlers are **names** (`"on": { "load": "loadCars" }`) resolved against host functions
  registered on the form component — see
  https://golemui.com/json/features/host-functions.md

## Validation

Definitions validate against published JSON Schemas: entry point
`https://golemui.com/schemas/form.schema.json` (packaged as `@golemui/gui-schemas`). Keep the
`$schema` key in authored files so editors validate live.

With the GolemUI MCP available, ALWAYS finish by calling `json_validate_form_definition` —
fix `errors` and re-validate until `valid: true`. `warnings` (likely-custom widgets) and
`expressionWarnings` (linted reactive expressions) are advisory. Without the MCP, run the
same check from the shell: `npx -y @golemui/gui-mcp validate-json <file.json>` (exit 0 =
valid, 1 = fix the reported errors; see [mcp.md](mcp.md)).

## Generating from an existing schema

With the MCP: `json_generate_from_schema` maps a JSON Schema (e.g. Zod-derived) to a validated
form; `json_generate_from_openapi` resolves an OpenAPI 3.x operation (`"POST /users"` or an
operationId) and builds the form from its request body. Both return an `unmapped` list —
surface anything left over. Walkthrough:
https://golemui.com/json/mcp/generating-from-a-schema.md

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
