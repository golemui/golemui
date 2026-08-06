/**
 * The JSON form-definition half of the server's connect-time guidance (the MCP
 * `initialize.instructions` field). Composed with the DX half in `cli.ts`. Owned here so
 * the JSON path's routing advice evolves independently of the `gui.*` path's.
 */
export const JSON_INSTRUCTIONS =
  '1. Starting from an existing schema? Use a generator — both return a pre-validated definition, ' +
  'so check the returned `unmapped` list and surface anything left over to the user. For a raw JSON ' +
  'Schema (e.g. an API request body), call `json_generate_from_schema`. For an OpenAPI 3.x spec, ' +
  'call `json_generate_from_openapi`: pass `operation` as "METHOD /path" (e.g. "POST /users") or an ' +
  'exact operationId, plus the spec as a parsed `document` or a `documentUrl` to fetch — it ' +
  "resolves the operation's request body, dereferences `$ref`s, and falls back to the " +
  "operation's parameters when there is no request body.\n" +
  '2. Building or editing by hand? Look up a single widget with `json_get_widget_spec` (its `kind`, ' +
  '`props`, and `validator` shape), and cross-cutting behavior that spans widgets — conditional ' +
  'rendering, per-state prop overrides, validation rules and error messages — with `get_concept`. ' +
  'Before writing a mandatory checkbox or gating a button on `$formIsInvalid`, call ' +
  '`get_concept({ concept: "validation" })` — both have non-obvious traps.\n' +
  '3. ALWAYS finish by calling `json_validate_form_definition`. It checks the definition against the ' +
  'bundled JSON Schemas and returns `{ valid, errors, warnings, expressionWarnings }`. Treat ' +
  '`errors` as blocking: fix them and re-validate until `valid` is true. `warnings` (likely-custom ' +
  'widgets) and `expressionWarnings` (linted reactive expressions) are advisory — surface them, ' +
  'but they do not flip `valid`.\n\n';
