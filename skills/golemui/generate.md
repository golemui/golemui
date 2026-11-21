# GolemUI — generating a form from a schema

Turning a JSON Schema (a request body, a Zod-derived schema) or an OpenAPI 3.x operation into a
form definition, with the MCP, in code, or from the command line. The result is a definition
like any other ([definition.md](definition.md)).

## With the MCP

- `json_generate_from_schema({ jsonSchema })` maps a JSON Schema to a form.
- `json_generate_from_openapi({ document, operation })` (or `documentUrl` instead of
  `document`) finds the operation, `"POST /users"` or an operationId, and builds the form from
  its request body, or from its parameters when it has none.

Both return the definition already validated, plus `diagnostics` (what the form cannot express
exactly, each with a severity, a code, the data path and a JSON Pointer) and an `unmapped`
list. Both take `overrides`, widget fields by data path such as
`{ "address.street": { "widget": "textarea" } }`, and `rules` to choose other widgets.
`if`/`then`/`else`, `dependentRequired` and a discriminated `oneOf` become `include.when`
conditions and form `states`.

Walkthrough: https://golemui.com/json/mcp/generating-from-a-schema.md

## Without the MCP

- In code: `fromJsonSchema(schema, { preset: guiPreset() })`, with `fromJsonSchema` from
  `@golemui/schemas/json-schema` and `guiPreset` from `@golemui/gui-schemas/json-schema`,
  returns `{ formDefinition, diagnostics }`. It also runs in browsers and Workers.
- As a file:
  `npx @golemui/schemas convert schema.json --preset @golemui/gui-schemas/json-schema --out form.json`.
  It does not replace an existing file without `--force`.

A diagnostic of severity `error` means the field is not rendered; `warning` means it is
rendered in an approximate way; `info` is a note.

## Rules

### rule: surface-what-was-not-mapped

When: a form was generated from a JSON Schema or an OpenAPI operation.

Do: tell the user what is in `diagnostics` and in the `unmapped` list.

Wrong:

- Doing: presenting the generated form and saying nothing of the fields left over.

  Because: a field with an `error` diagnostic is not rendered, and the user takes the form for complete.

Applies: json-api, generation, mcp

Source: libs/gui/mcp/src/json/generate-from-json-schema.ts#generateFromJsonSchema, libs/gui/mcp/src/json/generate-from-openapi.ts#generateFromOpenapi
