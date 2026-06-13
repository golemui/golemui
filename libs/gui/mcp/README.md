# @golemui/gui-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI coding
assistants (Claude Code, Cursor, Windsurf, …) deterministic schema validation and form
generation for [GolemUI](https://golemui.com) form definitions.

GolemUI forms are portable JSON schemas — small enough that an LLM can emit them cleanly,
strict enough that one wrong property name breaks the runtime. This server closes the gap:
your AI calls it to **validate** what it wrote and to **generate** forms from existing
JSON Schemas or OpenAPI operations, with the bundled GolemUI schemas as the source of truth.

## Two entry points (one surface, two ways to author it)

A GolemUI form can be written two ways, and the MCP serves both:

- a **JSON form definition**: the serializable object `{ form: [...widgets], states?: {...} }`;
- **`gui.*` DX code**: the fluent TypeScript builder that _produces_ that same definition.

There is no toggle. On connect the server sends one block of guidance (the MCP `initialize.instructions`
field, `SERVER_INSTRUCTIONS` in [`src/cli.ts`](./src/cli.ts)) and the agent self-routes by what it is
producing:

1. **JSON path**: generate or hand-author, then **always finish with `validate_form_definition`**.
2. **`gui.*` path**: call **`list_dx_factories` first** (the complete reference), write the form, then
   **always finish with `check_dx_code`**.

The two terminal checks are not interchangeable: `check_dx_code` validates `gui.*` _code_,
`validate_form_definition` validates a JSON _object_. Each tool's own `description` reinforces the routing
(e.g. `get_widget_spec` tells a `gui.*` author it isn't needed). To read what a client actually sees, run
`npm run start:mcp` (the MCP Inspector).

The split is structural, not just textual: the two paths live in separate modules
([`src/json/`](./src/json) and [`src/dx/`](./src/dx)) over a small shared surface
([`src/shared/`](./src/shared)); neither imports the other.

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

Returns a detailed guide for a cross-cutting concept — things that span multiple widgets
and affect the whole form: conditional rendering (`include`/`exclude`, named-state and
inline `when`), state-suffixed props (`"label.stateName": "..."`), the reactive scope
(`$form`, `$meta`, `$errors`, `$formIsInvalid`), and widget icons.

**Input:** `{ concept }` — one of `"states"`, `"string-interpolation"`, `"reactive-scope"`, `"icons"`

> The five tools above serve the **JSON** surface. The three below serve the **`gui.*`** (DX code) surface —
> see [Two entry points](#two-entry-points-one-surface-two-ways-to-author-it).

### `list_dx_factories`

**Call this first when writing `gui.*` code.** Returns the complete `gui.*` DX reference in one call: every
factory with its namespace, calling convention, a **compile-verified** example, and its gotchas — plus the
cross-cutting patterns and the common authoring rules. Its imports + render snippet are **tailored to your
target framework** (`GOLEMUI_FRAMEWORK`). Self-sufficient for most forms; keep it in context and write from it.

**Input:** none.

### `get_dx_spec`

A rare single-factory deep-dive — one factory's calling convention, example, and notes. Usually unneeded
(`list_dx_factories` already carries every factory); reach here only to re-confirm one in isolation.

**Input:** `{ factory }` — the camelCase name (`textInput`, `dropdown`, `radiogroup`, `button`, …).

### `check_dx_code`

**The `gui.*` terminal check** — the counterpart of `validate_form_definition` for _code_ instead of a JSON
_object_. Type-checks the snippet against the **real `@golemui` type declarations** (compile-is-truth: GolemUI
isn't in any model's training data, so generated `gui.*` is often a confident fabrication that doesn't
compile). Also catches two compiler-invisible footguns — a misplaced `include`/`exclude` on a `gui.*` spread,
and reactive-expression mistakes in `when` strings. Returns `{ ok, diagnostics }`; each diagnostic carries a
fix `hint`. Treat `ok: false` as blocking.

**Input:** `{ code }` — the `gui.*` snippet (a bare `gui.inputs.*` array is fine; the import is added if missing).

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

Then reload the VS Code window (Cmd+Shift+P -> "Developer: Reload Window"). The tools will appear in Claude's tool list for this workspace.

Remove the entry from .mcp.json when done.

### Other development commands

```bash
npx nx run gui-mcp:vite:test     # run the test suite
```
