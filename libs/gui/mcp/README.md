# @golemui/gui-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI coding
assistants (Claude Code, Cursor, Windsurf, …) deterministic schema validation and form
generation for [GolemUI](https://golemui.com) form definitions.

GolemUI forms are portable JSON schemas — small enough that an LLM can emit them cleanly,
strict enough that one wrong property name breaks the runtime. This server closes the gap:
your AI calls it to **validate** what it wrote and to **generate** forms from existing
JSON Schemas or OpenAPI operations, with the bundled GolemUI schemas as the source of truth.

## How an agent uses it

A GolemUI form is a **JSON form definition**: the serializable object
`{ form: [...widgets], states?: {...} }`.

On connect the server sends one block of guidance (the MCP `initialize.instructions` field,
`SERVER_INSTRUCTIONS` in [`src/cli.ts`](./src/cli.ts)). It tells the agent to generate or
hand-author the definition, and then to **always finish with `json_validate_form_definition`**.
Each tool has its own `description`. To read what a client actually sees, run
`npm run start:mcp` (the MCP Inspector).

The JSON form-definition tools are in [`src/json/`](./src/json). The shared code (the
`get_concept` reference, the linters and the tool wiring) is in [`src/shared/`](./src/shared).

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

## CLI (no MCP client needed)

The terminal check `json_validate_form_definition` is also a plain subcommand of the same
bin, so any shell (a CI step, a git hook, or an AI agent without an MCP connector) can verify
a form:

```bash
npx -y @golemui/gui-mcp validate-json signup-form.json  # JSON definition → bundled schemas
npx -y @golemui/gui-mcp --help
```

`validate-json` prints a single JSON result on stdout (the same shape as the MCP tool)
and exits `0` on pass, `1` when problems were found, `2` on usage or file errors. In
restricted environments, install it as a devDependency (`npm i -D @golemui/gui-mcp`) and the
same commands resolve the project-local bin with no network at run time.

## Tools

### `json_validate_form_definition`

Validates a GolemUI form definition against the bundled JSON Schemas. Returns
`{ valid: true }` on success, or a structured list of errors with JSON Pointer paths
and concrete fix suggestions ("`format: 'mail'` is not valid — did you mean `'email'`?").
Also lints reactive expressions (`include.when`, `disabled.when`, …) for common mistakes
like missing `$form.` prefixes, single `=` in equality checks, and unbalanced brackets.

**Input:** `{ formDefinition: { form: [...], states?: {...} } }`

### `json_generate_from_schema`

Converts a JSON Schema (the form-data shape, e.g. a Zod-derived schema) into a GolemUI
form definition, with `fromJsonSchema` from `@golemui/schemas/json-schema` and the gui
preset from `@golemui/gui-schemas/json-schema`. It handles formats, enums, local `$ref`,
`allOf`, nested objects, arrays, discriminated `oneOf`/`anyOf`, and `if/then/else` and
`dependent*` as conditions and form states. The result is validated before it is returned.

`diagnostics` lists what the form cannot express exactly, each with a `severity`, a `code`,
the data `path` and the JSON `pointer` into the input. `unmapped` repeats its errors and
warnings as `{ path, reason }`. `rules` and `overrides` choose other widgets: see the
`@golemui/schemas` README.

**Input:** `{ jsonSchema, submitAction?, submitLabel?, layout?, rules?, overrides? }`

### `json_generate_from_openapi`

Resolves an OpenAPI 3.x operation (e.g. `"POST /users"` or an `operationId`) and converts
its JSON request body, with its `$ref`s into the document, like `json_generate_from_schema`.
Falls back to the operation parameters when there is no object request body.

**Input:** `{ document | documentUrl, operation, submitAction?, submitLabel?, rules?, overrides? }`

### `json_get_widget_spec`

Returns the JSON Schema, kind, a minimal working example, and authoring notes for a
single GolemUI widget. Cheaper than dumping the whole API into the model's context.

**Input:** `{ widgetType }` (one of the widget `type` constants — `textinput`,
`dropdown`, `repeater`, `grid`, etc.)

### `get_concept`

Returns a detailed guide for a cross-cutting concept — things that span multiple widgets
and affect the whole form: conditional rendering (`include`/`exclude`, named-state and
inline `when`), state-suffixed props (`"label.stateName": "..."`), the reactive scope
(`$form`, `$meta`, `$errors`, `$formIsInvalid`), and widget icons.

**Input:** `{ concept }` — one of `"states"`, `"string-interpolation"`, `"reactive-scope"`, `"icons"`

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
const { formDefinition, diagnostics } = generateFromJsonSchema({ jsonSchema: mySchema });

// Generate a form from an OpenAPI spec
const { formDefinition: userForm } = await generateFromOpenapi({
  documentUrl: 'https://example.com/openapi.json',
  operation: 'POST /users',
});
```

The tool descriptor objects (`VALIDATE_FORM_DEFINITION_TOOL`, `GENERATE_FROM_JSON_SCHEMA_TOOL`, ...)
are also exported if you want to register the tools in your own MCP server.

### Other runtimes and browsers

`@golemui/gui-mcp/json` has the JSON tools and imports no Node built-ins, so it bundles
anywhere, Cloudflare Workers included. `validateFormDefinition` there is synchronous
and loads the validators of every widget type.

In a browser, use `@golemui/gui-mcp/json/lazy`. Each widget type has its own validator module,
and `validateFormDefinitionAsync` loads only the ones the form uses (about 50 KB gzipped for a
typical form), then returns the same result as `validateFormDefinition`:

```ts
import { preload, validateFormDefinitionAsync } from '@golemui/gui-mcp/json/lazy';

// Optional: start loading the common validators before the first form arrives.
preload(['textinput', 'select']);

const result = await validateFormDefinitionAsync({ formDefinition: myForm });
if (!result.valid) console.error(result.errors);
```

No validator is compiled at runtime, so both entries work under a strict Content Security
Policy (no `unsafe-eval`).

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
