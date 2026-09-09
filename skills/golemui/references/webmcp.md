# GolemUI — WebMCP (expose a form to the browser's AI agent)

[WebMCP](https://github.com/webmachinelearning/webmcp) is a W3C draft (Google + Microsoft) that
lets a page register tools on `document.modelContext` for the AI agent driving the browser.
Chrome ships it behind `chrome://flags/#enable-webmcp-testing`. `@golemui/webmcp` exposes one
GolemUI form as such tools, driven by the real widgets and gated by the form's own validation.
MCP: `get_concept({ concept: "webmcp" })`.

## Install and wire

```bash
npm i @golemui/webmcp   # peer: @golemui/core
```

`plugins` is an init-config key, a sibling of `formDef` (NOT inside `formConfig`), identical in
every framework:

```ts
import { webmcp } from '@golemui/webmcp';

const config = {
  formDef,
  plugins: [
    webmcp({
      name: 'signup', // tool name prefix, ^[A-Za-z0-9_.-]{1,100}$
      description: 'Create a new account with an email address and a plan.', // ≤ 500 chars
    }),
  ],
};
// React: <GuiForm config={config} formSubmit={onSubmit} />   Vue: <GuiForm :config="config" @form-submit="onSubmit" />
// Angular: <gui-form [config]="config" (formSubmit)="onSubmit($event)">   Lit/vanilla: el.config = config
```

Keep the `config` identity stable (module level or memoized): a new identity re-initializes the
form and re-registers the tools. Where `document.modelContext` is missing (server renders, other
browsers) the plugin does nothing, so it is safe to leave in place.

## What gets registered

| Tool            | Does                                                                       | Annotations                                 |
| --------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| `<name>-fill`   | Sets the given fields, runs their `change` events, returns values + errors | `untrustedContentHint`                      |
| `<name>-submit` | Same, then submits through the normal `formSubmit` path when valid         | `consequentialHint`, `untrustedContentHint` |
| `<name>-read`   | Opt-in (`tools: ['read', 'fill', 'submit']`): current values and validity  | `readOnlyHint`, `untrustedContentHint`      |

The input schema mirrors the form data: dot paths become nested objects, required validators
become `required`, `options`/`items` become `enum` (or `oneOf` with `const` + `title` when labels
differ), validator keywords (`minLength`, `minimum`, `format`, …) are copied, descriptions come
from the label, the hint/placeholder and the visibility condition (`include`/`exclude`). Password
values are never exposed nor echoed; upload widgets are described but cannot be filled (the
`uploadService` produces their value); repeaters are arrays of row objects built from the
template.

Results are always data, never a rejection:

```ts
{ status: 'filled' | 'submitted' | 'invalid' | 'read' | 'error',
  isValid?: boolean, values?: {...}, errors?: { 'user.email': ['required'] },
  notVisible?: ['company'], ignored?: ['nickname'], hidden?: [...], message?: string }
```

## Options

```ts
webmcp({
  name, description,
  title?: 'Sign up',
  tools?: ['fill', 'submit'],                       // default
  toolOverrides?: { submit: { name?, description?, title?, consequential?: boolean } },
  exclude?: ['marketing.consent'],                  // paths the agent must never set
  fields?: { customdate: { schema: { type: 'string', format: 'date' } } }, // custom widget types
  exposedTo?: ['https://agent.example'],            // cross-origin exposure, same-origin by default
  modelContext?: fakeOrPolyfill,                    // tests / polyfills; default document.modelContext
});
```

## Rules

- One `name` per form on a page; a duplicate is suffixed (`signup-2`) with a console warning.
- Agents fill choice widgets by label or value (`"Team plan"` or `"team"`); unknown choices are
  rejected with the accepted labels, they never reach the data.
- A fill never runs the form-wide validation pass, so untouched required fields do not turn red
  until a submit; `submit` refuses (`status: 'invalid'`) when anything fails, including a
  rejected value.
- Custom widget types the gui set cannot describe fall back to the validator `type`, then the
  current value; a console warning names them once. Describe them with `fields`.
- Test without the Chrome flag by passing a fake `modelContext` (see the Cypress suite in
  `libs/ui-testing/src/lib/core-features/webmcp.cy.ts`).
