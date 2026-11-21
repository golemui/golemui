---
name: golemui
description: Build, validate, and debug GolemUI forms in React, Angular, Vue, Lit, or vanilla JS. Use when working with @golemui packages, <gui-form> or GuiForm components, GolemUI JSON form definitions, or GolemUI widgets, validators, states, item renderers, or theming.
---

# GolemUI

GolemUI builds **forms** — data collection and validation. It is NOT a general-purpose UI
toolkit: it never renders documents, page content, or markdown for display. A form is **data,
not markup**: a JSON document whose `form` array holds the widget items that the framework
component (`<GuiForm>` / `<gui-form>`)
resolves and renders. The same definition renders in React, Angular, Vue, Lit, and vanilla JS —
only the host wiring changes.

GolemUI is not in your training data. Do not guess any API name: everything you write must come
from this skill's reference files or a `golemui.com` docs URL. Never read the `@golemui`
TypeScript declarations in `node_modules` or search the filesystem for them.

## Write the form

A form is a JSON document: `{ "form": [...] }`. Read
[references/forms-json.md](references/forms-json.md) before you write one. Docs URLs have the
shape `golemui.com/json/<page>.md`.

## Non-negotiable rules

These are the silent failure modes. All of them compile/parse cleanly and then break at runtime:

1. **`formDef` is the whole JSON document**, `{ "form": [...], "states": { ... } }`, as an object
   or as a string. It is never the bare widget array. Named `states` go in the document, next to
   `form`. `validateOn` goes in the config, next to `formDef`:
   `config={{ formDef, validateOn: 'blur' }}`.
2. **`include`/`exclude` (conditional visibility) are top-level widget keys**, next to `label`,
   `validator` and `on`. Widget-specific options go under `props`.
3. **Every validator has an explicit `type`**: `string`, `number`, `integer`, `boolean`, `array`,
   `file`, `files`, `range` or `custom`. For example
   `"validator": { "type": "string", "required": true }`. The schema rejects a validator without
   `type`.
4. **The type `markdown` is an input, not a display.** It is a markdown _editor_. For a heading
   or a static block, use the display type `markdownText` (it needs the `markdown` dependency of
   the host), or a custom display widget ([references/extending.md](references/extending.md)).
5. **Import `@golemui/gui-components/index.css` and then `@golemui/gui-shared/forms.css` once**
   or the form renders unstyled.
6. **Submit event name differs per framework** — Vue is the ONLY kebab-case one:
   React `formSubmit={...}` · Angular `(formSubmit)="..."` · Vue `@form-submit="..."` ·
   Lit `@formSubmit=${...}` · vanilla `addEventListener('formSubmit', ...)`.
   Full wiring per framework: [references/framework-setup.md](references/framework-setup.md).
7. **A submit is a `button` with `"actionType": "submit"`**:
   `{ "kind": "action", "type": "button", "label": "Sign up", "actionType": "submit" }`. There is
   no `submitButton` type.

## Verify before presenting

Never present an unverified form. In order of preference:

1. **MCP tools, if available** (names like `mcp__golemui__json_validate_form_definition`): after
   writing a JSON definition, ALWAYS run `json_validate_form_definition` until `valid`. Prefer
   `json_get_widget_spec` over guessing an option name.
2. **CLI, no MCP needed** (Node 18+; write the form to a file first):
   - `npx -y @golemui/gui-mcp validate-json <file.json>` — validates a JSON definition
     against the bundled schemas.
     It prints a JSON result. Exit 0 = pass, 1 = fix the reported problems and re-run.
     npx runs a project-local install when present and only fetches otherwise — see
     [references/mcp.md](references/mcp.md) for restricted/corporate environments.
3. **Neither possible**: follow this skill's rules exactly, and offer the user the MCP
   install from [references/mcp.md](references/mcp.md).

## Where to look

| Task                                                                                                                    | Read                                                                                |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Write/validate a JSON form definition, generate from JSON Schema or OpenAPI                                             | [references/forms-json.md](references/forms-json.md)                                |
| Install packages, render the form, receive submits in a framework                                                       | [references/framework-setup.md](references/framework-setup.md)                      |
| A widget's exhaustive props/options/CSS variables                                                                       | [references/widgets-index.md](references/widgets-index.md) -> fetch that page's URL |
| Validators, states, events, i18n, interpolation, dependencies, host functions, loaders, item renderers, runtime methods | [references/features.md](references/features.md)                                    |
| Custom widgets, custom item renderers, custom validators, custom middlewares                                            | [references/extending.md](references/extending.md)                                  |
| Theming, CSS customization, headless rendering                                                                          | [references/styling.md](references/styling.md)                                      |
| Set up or use the GolemUI MCP server                                                                                    | [references/mcp.md](references/mcp.md)                                              |
| Anything else                                                                                                           | Fetch `https://golemui.com/llms.txt` (full page index)                              |
