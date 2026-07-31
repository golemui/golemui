---
name: golemui
description: Build, validate, and debug GolemUI forms in React, Angular, Vue, Lit, or vanilla JS. Use when working with @golemui packages, the gui.* form builder, <gui-form> or GuiForm components, GolemUI JSON form definitions, or GolemUI widgets, validators, states, item renderers, or theming.
---

# GolemUI

GolemUI builds **forms** — data collection and validation. It is NOT a general-purpose UI
toolkit: it never renders documents, page content, or markdown for display. A form is **data,
not markup**: an array of widget items that the framework component (`<GuiForm>` / `<gui-form>`)
resolves and renders. The same definition renders in React, Angular, Vue, Lit, and vanilla JS —
only the host wiring changes.

GolemUI is not in your training data. Do not guess any API name: everything you write must come
from this skill's reference files or a `golemui.com` docs URL. Never read the `@golemui`
TypeScript declarations in `node_modules` or search the filesystem for them.

## Choose the API

Two ways to author the same form. **HARD GATE — do not write a single line of form code until
the user has told you which API they want.** If the current request doesn't already state it,
you MUST stop and ask (use the AskUserQuestion tool when available): TS API (gui.\*, coded
programmatically) or JSON API (a serializable document, e.g. stored or served at runtime). There
is NO default — never pick one silently, even when operating autonomously, even if one seems
obvious. Never mix their syntaxes in one artifact:

- **TS API** — the `gui.*` builder from `@golemui/gui-shared`
  (`gui.inputs.textInput('email', { label: 'Email' })`).
  → Read [references/forms-dx.md](references/forms-dx.md) ONCE and write the whole form from it.
- **JSON API** — a serializable `{ "form": [...] }` document. Use when forms must be stored,
  transferred, diffed, or served from a backend at runtime.
  → Read [references/forms-json.md](references/forms-json.md).

Docs URLs mirror the split: `golemui.com/dx/<page>.md` (TS) vs `golemui.com/json/<page>.md`
(JSON). Fetch the flavor matching what you are writing.

## Non-negotiable rules

These are the silent failure modes. All of them compile/parse cleanly and then break at runtime:

1. **`formDef` is ALWAYS the bare array.** Form-wide config (named `states`, `validateOn`) goes
   in a sibling `formConfig`: `config={{ formDef: form, formConfig: { states, validateOn } }}`.
   Wrapping the array (`formDef: { states, form: [...] }`) compiles but the form renders
   **blank with no error**.
2. **`include`/`exclude` (conditional visibility) are config keys** inside the factory's
   argument. Spreading them onto the result (`{ ...gui.inputs.x(...), include }`) compiles but
   is a **silent no-op**.
3. **Validator `type` — one rule, three cases**: choice widgets (`dropdown`, `radiogroup`,
   `select`) REQUIRE an explicit `type` (`validator: { type: 'string', required: true }`);
   `repeater` auto-supplies `type: 'array'` — pass only rules (`{ required: true, minItems: 1 }`);
   everything else takes the loose validator with NO `type` (`{ required: true }`).
4. **Markdown is an input, not a display.** `gui.inputs.markdown` is a markdown _editor_. For a
   heading or static block use `gui.displays.display(() => <h2>…</h2>)` returning your
   framework's own node.
5. **Import `@golemui/gui-components/index.css` once** or the form renders unstyled.
6. **Submit event name differs per framework** — Vue is the ONLY kebab-case one:
   React `formSubmit={...}` · Angular `(formSubmit)="..."` · Vue `@form-submit="..."` ·
   Lit `@formSubmit=${...}` · vanilla `addEventListener('formSubmit', ...)`.
   Full wiring per framework: [references/framework-setup.md](references/framework-setup.md).
7. **There is no fluent builder and no `gui.actions.submitButton`.** A submit is
   `gui.actions.button({ label, actionType: 'submit' })`.

## Verify before presenting

Never present an unverified form. In order of preference:

1. **MCP tools, if available** (names like `mcp__golemui__dx_check_code`): after writing
   `gui.*` code, ALWAYS run `dx_check_code`; after writing a JSON definition, ALWAYS run
   `json_validate_form_definition` until `valid`. Prefer `dx_get_spec` /
   `json_get_widget_spec` over guessing an option name.
2. **CLI, no MCP needed** (Node 18+; write the form to a file first):
   - `npx -y @golemui/gui-mcp check-dx <file.ts>` — type-checks `gui.*` code against the
     real `@golemui` types.
   - `npx -y @golemui/gui-mcp validate-json <file.json>` — validates a JSON definition
     against the bundled schemas.
     Both print a JSON result; exit 0 = pass, 1 = fix the reported problems and re-run.
     npx runs a project-local install when present and only fetches otherwise — see
     [references/mcp.md](references/mcp.md) for restricted/corporate environments.
3. **Neither possible**: follow this skill's rules exactly, and offer the user the MCP
   install from [references/mcp.md](references/mcp.md).

## Where to look

| Task                                                                                                                               | Read                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Write a form in TypeScript (`gui.*`)                                                                                               | [references/forms-dx.md](references/forms-dx.md) — complete, compile-verified factory reference |
| Write/validate a JSON form definition, generate from JSON Schema or OpenAPI                                                        | [references/forms-json.md](references/forms-json.md)                                            |
| Install packages, render the form, receive submits in a framework                                                                  | [references/framework-setup.md](references/framework-setup.md)                                  |
| A widget's exhaustive props/options/CSS variables                                                                                  | [references/widgets-index.md](references/widgets-index.md) → fetch that page's URL              |
| Validators, states, events, i18n, interpolation, dependencies, host functions, loaders, item renderers, runtime methods, selectors | [references/features.md](references/features.md)                                                |
| Custom widgets, custom item renderers, custom validators, custom middlewares                                                       | [references/extending.md](references/extending.md)                                              |
| Theming, CSS customization, headless rendering                                                                                     | [references/styling.md](references/styling.md)                                                  |
| Set up or use the GolemUI MCP server                                                                                               | [references/mcp.md](references/mcp.md)                                                          |
| Anything else                                                                                                                      | Fetch `https://golemui.com/llms.txt` (full page index)                                          |

Fetch discipline: `forms-dx.md` is self-sufficient for almost every TS form — read it once, keep
it in context, and write from it instead of making many small lookups.
