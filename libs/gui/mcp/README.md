# @golemui/gui-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI coding
assistants (Claude Code, Cursor, Windsurf, …) deterministic schema validation and form
generation for [GolemUI](https://golemui.com) form definitions.

GolemUI forms are portable JSON schemas — small enough that an LLM can emit them cleanly,
strict enough that one wrong property name breaks the runtime. This server closes the gap:
your AI calls it to **validate** what it wrote and to **generate** forms from existing
JSON Schemas or OpenAPI operations, with the bundled GolemUI schemas as the source of truth.

## Install

The server is a standalone Node CLI distributed on npm. Add it to your IDE's MCP config —
no project install required.

### Claude Code

```bash
claude mcp add golemui -- npx -y @golemui/gui-mcp
```

Or paste this into `~/.claude/settings.json` (or your project's `.mcp.json`):

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

### Cursor / Windsurf / other MCP-capable IDEs

Same config — point an `mcpServers.golemui` entry at `npx -y @golemui/gui-mcp`.

### Verify

```bash
npx -y @golemui/gui-mcp < /dev/null
# → @golemui/gui-mcp v0.0.1 ready on stdio
```

## Tools

### `validate_form_definition`

Validates a GolemUI form definition against the bundled JSON Schemas. Returns
`{ valid: true }` on success, or a structured list of errors with JSON Pointer paths
and concrete fix suggestions ("`format: 'mail'` is not valid — did you mean `'email'`?").
Also lints reactive expressions (`include.when`, `disabled.when`, …) for common mistakes
like missing `$form.` prefixes, single `=` in equality checks, and unbalanced brackets.

**Input:** `{ formDefinition: { form: [...], states?: {...} } }`

### `generate_from_json_schema`

Maps a JSON Schema (the form-data shape, e.g. a Zod-derived schema) into a GolemUI
form definition. Handles strings (with `format` → specialized widgets), numbers,
booleans, enums, nested objects, and arrays of objects. The result is validated before
being returned, so you get a guaranteed-correct form or an explicit list of what could
not be mapped.

**Input:** `{ jsonSchema, submitAction?, submitLabel?, layout? }`

### `generate_from_openapi`

Resolves an OpenAPI 3.x operation (e.g. `"POST /users"` or an `operationId`), dereferences
its request body schema, and emits a validated GolemUI form. Falls back to operation
parameters when no JSON request body is present.

**Input:** `{ document | documentUrl, operation, submitAction?, submitLabel? }`

### `get_widget_spec`

Returns the JSON Schema, kind, a minimal working example, and authoring notes for a
single GolemUI widget. Cheaper than dumping the whole API into the model's context.

**Input:** `{ widgetType }` (one of the widget `type` constants — `textinput`,
`dropdown`, `repeater`, `flex`, etc.)

### `get_concept`

Returns a detailed guide for a cross-cutting concept - things that span multiple widgets
and affect the whole form. Use it when you need state-suffixed props
(`"label.stateName": "..."`) or to reuse a condition across multiple widgets via
`include`/`exclude`. Currently supported: `"states"`, `"string-interpolation"`.

**Input:** `{ concept }` - one of `"states"`, `"string-interpolation"`

## Library usage

The package also exports all tools as plain functions, so you can call them directly
from Node.js apps, scripts, or other libraries without running an MCP server.

```bash
npm install @golemui/gui-mcp
```

```ts
import {
  validateFormDefinition,
  generateFromJsonSchema,
  generateFromOpenapi,
  getWidgetSpec,
  getConcept,
} from '@golemui/gui-mcp';

// Validate a form definition
const result = validateFormDefinition({ formDefinition: myForm });
if (!result.valid) console.error(result.errors);

// Generate a form from a JSON Schema
const { form, unmapped } = generateFromJsonSchema({ jsonSchema: mySchema });

// Generate a form from an OpenAPI spec
const { form } = await generateFromOpenapi({
  documentUrl: 'https://example.com/openapi.json',
  operation: 'POST /users',
});
```

The tool descriptor objects (`VALIDATE_FORM_DEFINITION_TOOL`, `GENERATE_FROM_JSON_SCHEMA_TOOL`, ...)
are also exported if you want to register the tools in your own MCP server.

## How it stays accurate

The server ships a frozen snapshot of the GolemUI JSON Schemas inside its npm package,
version-locked to a specific GolemUI release. A CI check in this monorepo
(`npm run check:mcp-schemas`) fails if the snapshot drifts from the source schemas in
`@golemui/gui-shared`, so a published `@golemui/gui-mcp@X.Y.Z` always validates
against the exact same schema definitions as `@golemui/gui-*@X.Y.Z`.

No LLM calls happen inside this server — every tool is deterministic. The MCP is the
_grounding layer_ the host IDE's model calls into.

## Development

### Interactive testing with MCP Inspector

Start the MCP server and open a local web UI at <http://localhost:5173>

```bash
npm run start:mcp
```

To use the server from within Claude Code conversations, register with local Claude Code:

#### With the Claude code CLI

```bash
claude mcp add golemui-local -- node /Users/{USER}/{...}/golem/golemui/dist/libs/gui/mcp/cli.js
```

Then restart or reload the session. The tools appear in Claude's tool list.

Remove with claude mcp remove golemui-local when done.

#### With the Claude code extension

Create or edit the project-level MCP config at .mcp.json in the workspace root:

```json
{
  "mcpServers": {
    "golemui-local": {
      "command": "node",
      "args": ["/Users/{USER}/{...}/golem/golemui/dist/libs/gui/mcp/cli.js"]
    }
  }
}
```

Then reload the VS Code window (Cmd+Shift+P -> "Developer: Reload Window"). The 4 tools will appear in Claude's tool list for this workspace.

Remove the entry from .mcp.json when done.

### Other development commands

```bash
npx nx run gui-mcp:vite:test     # run the test suite
npm run sync:mcp-schemas            # refresh bundled schemas from libs/gui/shared
npm run check:mcp-schemas           # CI mode — exits non-zero if out of sync
```
