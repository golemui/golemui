---
name: golemui
description: Build, validate, and debug GolemUI forms written as JSON definitions and rendered in React, Angular, Vue, Lit, or vanilla JS. Use when working with @golemui packages, <gui-form> or GuiForm components, GolemUI JSON form definitions, or GolemUI widgets, validators, states, events, item renderers, or theming.
---

# GolemUI

GolemUI builds forms: data collection and validation. It is not a general-purpose UI toolkit. A
form is data, a JSON definition: an array of widgets that the framework component
(`<GuiForm>` or `<gui-form>`) renders. The same definition renders in React, Angular, Vue, Lit
and vanilla JS; only the host wiring changes.

## Checking a definition

| MCP tool                        | CLI, no MCP needed (Node 18+)                       |
| ------------------------------- | --------------------------------------------------- |
| `json_validate_form_definition` | `npx -y @golemui/gui-mcp validate-json <file.json>` |

The CLI takes a file, prints a JSON result, and exits 0 when the definition is valid, 1 when
it is not. Setup and restricted environments: [mcp.md](mcp.md).

## Where to look

| Task                                                                  | Read                                                                                                        |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Write a definition: widgets, states, layouts, text, the submit button | [definition.md](definition.md)                                                                              |
| Validators and their messages                                         | [validators.md](validators.md)                                                                              |
| React to a change, load options, show a server error                  | [events.md](events.md)                                                                                      |
| A widget's options and CSS variables                                  | [widgets-index.md](widgets-index.md), then its page                                                         |
| Generate a form from a JSON Schema or an OpenAPI operation            | [generate.md](generate.md)                                                                                  |
| Render the form: install, config, submit, runtime methods             | [hosts/config.md](hosts/config.md), then `hosts/react.md`, `angular.md`, `vue.md`, `lit.md` or `vanilla.md` |
| Server rendering                                                      | [hosts/ssr.md](hosts/ssr.md)                                                                                |
| Markdown parser, upload service                                       | [host-services.md](host-services.md)                                                                        |
| i18n, interpolation, `$fn`, and the other features                    | [features.md](features.md)                                                                                  |
| Custom widgets, item renderers, custom validators, middlewares        | [extending.md](extending.md)                                                                                |
| Themes and CSS                                                        | [styling.md](styling.md)                                                                                    |
| The MCP server                                                        | [mcp.md](mcp.md)                                                                                            |
| Move a `gui.*` form to JSON                                           | [migrate-from-gui.md](migrate-from-gui.md)                                                                  |
| Anything else                                                         | `https://golemui.com/llms.txt`                                                                              |

## Rules

### rule: no-guessing-api-names

When: writing any GolemUI name: a package, a widget type, an option, an event.

Do: take it from this skill's files or from a `golemui.com` docs URL.

Even when: the name looks obvious, or the `@golemui` packages are installed in the project.

Wrong:

- Doing: reading the `@golemui` TypeScript declarations in `node_modules`, or searching the filesystem for them.

  Because: the declarations are large and mix the public API with internals.

- Doing: writing a name from memory of another forms library.

  Because: GolemUI is not in your training data, so the name is a guess.

Applies: json-api, docs

### rule: docs-url-matches-the-api

When: fetching a `golemui.com` docs page.

Do: fetch the JSON flavor, `golemui.com/json/<page>.md`.

Wrong:

- Doing: reading a `golemui.com/dx/<page>.md` page.

  Because: `/dx/` pages show the `gui.*` builder, and their option names end up in the JSON.

Applies: json-api, docs

### decision: verify-before-presenting

When: a definition is written and about to be shown to the user.

Decide: how to check it. Take the first path that is possible.

- **MCP tools available** — run `json_validate_form_definition`.
- **No MCP, a shell** — write the definition to a file and run `npx -y @golemui/gui-mcp validate-json <file.json>`.
- **Neither** — follow this skill's rules exactly, and offer the user the MCP install from [mcp.md](mcp.md).

Even when: the definition is small, looks right, or came from `toJsonFormDefinition`.

Wrong:

- Doing: presenting a definition that no check has run on, when the MCP or a shell is available.

  Because: a misspelled widget type parses as JSON; `validate-json` reports it: ``Expected `"textinput"` at `/form/0/type`, got `"textinpt"` ``.

Applies: json-api, mcp, validation

Source: libs/gui/mcp/src/cli-commands.ts#runCli, libs/gui/mcp/src/cli-commands.ts#USAGE, libs/gui/mcp/src/json/validate-form-definition.ts#JSON_VALIDATE_FORM_DEFINITION_TOOL

### rule: validate-json-until-valid

When: checking a definition with `json_validate_form_definition` or `validate-json`.

Do: fix the `errors` and check again until `valid: true`; then read every warning (`warnings`, `expressionWarnings`, `interpolationWarnings`), and fix it or tell the user why it stays.

Wrong:

- Doing: presenting the definition once `valid` is `true`, without reading its warnings.

  Because: `valid` ignores warnings, and a checkbox with only `required` comes back valid with the warning ``Boolean validator has `required: true` but no `const` ``.

Applies: json-api, validation, mcp

Source: libs/gui/mcp/src/json/validate-core.ts#runValidation, libs/gui/mcp/src/json/validate-core.ts#ValidateResult
