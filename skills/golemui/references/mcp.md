# GolemUI — MCP server & CLI verification

`@golemui/gui-mcp` gives agents deterministic validation and generation for GolemUI forms.
If its tools are available in your session, USE them: they are compile/schema-checked truth,
stronger than any text reference.

## CLI verification (no MCP install)

The same two terminal checks are runnable as plain shell commands — no MCP connector,
no configuration (Node 18+):

```bash
npx -y @golemui/gui-mcp check-dx <file.ts>        # type-checks gui.* code
npx -y @golemui/gui-mcp validate-json <file.json> # validates a JSON definition
```

Output is a single JSON result on stdout (`{ ok, diagnostics, expressionWarnings }` /
`{ valid, errors, warnings, expressionWarnings, interpolationWarnings }`). Exit codes:
0 = pass · 1 = problems found (fix and re-run) · 2 = usage/file error. The package is
self-contained (it bundles the schemas and `@golemui` type declarations), so the commands
work even before GolemUI is installed in the project.

**Corporate / restricted environments**: where MCP connectors need IT approval or the
agent's shell cannot reach the public registry, add the package as a devDependency —
`npm i -D @golemui/gui-mcp`. Verification then rides the normal dependency pipeline
(internal registry mirror, lockfile pinning, security scanning), and the same `npx`
commands resolve the project-local bin with zero network at run time. It ships under the
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
      "args": ["-y", "@golemui/gui-mcp"],
      "env": { "GOLEMUI_FRAMEWORK": "react" }
    }
  }
}
```

`GOLEMUI_FRAMEWORK` (`react` | `angular` | `vue` | `lit` | `vanilla`, default `react`) selects
which framework's imports/render/submit wiring the DX grounding shows. Set it to the host
project's framework — otherwise every project silently gets the React wiring.

## Tools and when to call them

TS `gui.*` path:

- `dx_list_factories` — call FIRST when writing `gui.*` code: the whole compile-verified
  factory catalog in one payload (this skill's `forms-dx.md` is generated from the same
  registry).
- `dx_get_spec({ factory })` — rare single-factory deep-dive.
- `dx_check_code({ code })` — **the terminal check**: type-checks the snippet against the real
  `@golemui` declarations. ALWAYS run it on finished `gui.*` code and fix errors before
  presenting. Requires `@golemui` packages installed (or built) in the project — install
  packages first, then check; it refuses rather than falsely passing when types are missing.

JSON path:

- `json_generate_from_schema({ jsonSchema, ... })` — JSON Schema → validated form definition.
- `json_generate_from_openapi({ document | documentUrl, operation, ... })` — OpenAPI 3.x
  operation → validated form definition. Both return an `unmapped` list — surface it.
- `json_get_widget_spec({ widgetType })` — one widget's JSON shape, example, and notes.
- `json_validate_form_definition({ formDefinition })` — **the terminal check**: fix `errors`
  and re-validate until `valid: true`; `warnings`/`expressionWarnings` are advisory.

Shared:

- `get_concept({ concept })` — deep guides for `states`, `string-interpolation`,
  `reactive-scope`, `icons`.

The two terminal checks are NOT interchangeable: `dx_check_code` validates code,
`json_validate_form_definition` validates a JSON object.

Docs: https://golemui.com/dx/mcp/overview.md · setup https://golemui.com/dx/mcp/setup.md ·
tools https://golemui.com/dx/mcp/tools-reference.md · schema generation walkthrough
https://golemui.com/dx/mcp/generating-from-a-schema.md
