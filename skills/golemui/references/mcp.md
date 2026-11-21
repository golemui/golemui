# GolemUI — MCP server & CLI verification

`@golemui/gui-mcp` gives agents deterministic validation and generation for GolemUI forms.
If its tools are available in your session, USE them: they check against the real schemas,
which is stronger than any text reference.

## CLI verification (no MCP install)

The same terminal check runs as a plain shell command, with no MCP connector and no
configuration (Node 18+):

```bash
npx -y @golemui/gui-mcp validate-json <file.json> # validates a JSON definition
```

Output is a single JSON result on stdout
(`{ valid, errors, warnings, expressionWarnings, interpolationWarnings }`). Exit codes:
0 = pass, 1 = problems found (fix and re-run), 2 = usage or file error. The package bundles
the schemas, so the command works even before GolemUI is installed in the project.

**Corporate / restricted environments**: where MCP connectors need IT approval or the
agent's shell cannot reach the public registry, add the package as a devDependency —
`npm i -D @golemui/gui-mcp`. Verification then rides the normal dependency pipeline
(internal registry mirror, lockfile pinning, security scanning), and the same `npx`
command resolves the project-local bin with zero network at run time. It ships under the
same `@golemui/*` scope the library itself requires, so no new allowlist entry is needed.

## Install (offer this to the user when the MCP is absent)

```bash
claude mcp add golemui -- npx -y @golemui/gui-mcp
```

or in `.mcp.json` / IDE MCP config (Cursor, Windsurf, …):

```json
{
  "mcpServers": {
    "golemui": {
      "command": "npx",
      "args": ["-y", "@golemui/gui-mcp"]
    }
  }
}
```

## Tools and when to call them

Form tools:

- `json_generate_from_schema({ jsonSchema, ... })` — JSON Schema → validated form definition.
- `json_generate_from_openapi({ document | documentUrl, operation, ... })` — OpenAPI 3.x
  operation → validated form definition. Both return `diagnostics` and an `unmapped` list
  (its errors and warnings) - surface them. Both take optional `rules` and `overrides` to
  choose other widgets, e.g. `overrides: { "address.street": { "widget": "textarea" } }`.
- `json_get_widget_spec({ widgetType })` — one widget's JSON shape, example, and notes.
- `json_validate_form_definition({ formDefinition })` — **the terminal check**: fix `errors`
  and re-validate until `valid: true`; `warnings`/`expressionWarnings` are advisory.

Concepts:

- `get_concept({ concept })` — deep guides for `states`, `string-interpolation`,
  `reactive-scope`, `icons`.

Docs: https://golemui.com/json/mcp/overview.md, setup https://golemui.com/json/mcp/setup.md,
tools https://golemui.com/json/mcp/tools-reference.md, schema generation walkthrough
https://golemui.com/json/mcp/generating-from-a-schema.md
