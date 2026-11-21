# GolemUI — the MCP server and the CLI

`@golemui/gui-mcp` validates JSON definitions, generates them from a schema, and describes
widgets and concepts. Its check also runs as a shell command, with no MCP connector. When to
run it is in "Checking a definition" of [SKILL.md](SKILL.md).

## The CLI

```bash no-check
npx -y @golemui/gui-mcp validate-json <file.json>
```

It prints one JSON result on stdout,
`{ valid, errors, warnings, expressionWarnings, interpolationWarnings }`, and exits with 0 when
the definition is valid, 1 when it is not, and 2 on a usage or file error. The package bundles
the schemas, so the command works before GolemUI is installed in the project.

Where MCP connectors need IT approval, or the agent's shell cannot reach the public registry,
add the package as a dev dependency: `npm i -D @golemui/gui-mcp`. The same `npx` command then
runs the project's own copy, with no network, and the package goes through the project's usual
pipeline (registry mirror, lockfile, security scanning).

## Install the MCP

```bash
claude mcp add golemui -- npx -y @golemui/gui-mcp
```

or in `.mcp.json`, or the MCP config of the IDE (Cursor, Windsurf, …):

```json no-check
{
  "mcpServers": {
    "golemui": {
      "command": "npx",
      "args": ["-y", "@golemui/gui-mcp"]
    }
  }
}
```

## Tools for JSON

| Tool                            | What it does                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `json_validate_form_definition` | validates a definition, as the CLI does                                                                 |
| `json_get_widget_spec`          | one widget's JSON shape (`kind`, `props`, `validator`), an example and notes                            |
| `json_generate_from_schema`     | a JSON Schema to a validated definition ([generate.md](generate.md))                                    |
| `json_generate_from_openapi`    | an OpenAPI 3.x operation to a validated definition ([generate.md](generate.md))                         |
| `get_concept`                   | a guide to `states`, `string-interpolation`, `reactive-scope`, `validation`, `icons` or `host-services` |

Docs: https://golemui.com/json/mcp/overview.md · setup https://golemui.com/json/mcp/setup.md ·
tools https://golemui.com/json/mcp/tools-reference.md
