# AGENTS.md

Guidance for AI coding agents. GolemUI is an open-source (MIT) library for building dynamic forms
from JSON in React, Angular, Vue, Lit and vanilla JS.

This file has two parts: [using GolemUI in an app](#using-golemui-in-an-app) and
[working on this repository](#working-on-this-repository).

## Using GolemUI in an app

GolemUI is newer than most models' training data. Do not guess API names: take them from the
skill, the MCP server or the docs below.

- **Agent skill:** `npx skills add golemui/golemui@v2.3.0` installs
  [`skills/golemui`](https://github.com/golemui/golemui/tree/v2.3.0/skills/golemui) of the latest
  release, the rules and API reference for writing GolemUI forms. Read it before writing form code.
  Keep the tag: the `main` branch is the development branch of the next major version.
- **MCP server:** `npx -y @golemui/gui-mcp` validates form definitions and generates a form from
  a JSON Schema or an OpenAPI operation. In Claude Code:
  `claude mcp add golemui -- npx -y @golemui/gui-mcp`. Other clients:
  [MCP setup](https://golemui.com/mcp/setup/).
- **Docs for LLMs:** [llms.txt](https://golemui.com/llms.txt) indexes every docs page as Markdown.

### Install

Five packages, always at the same version:

```bash
# React
npm i @golemui/core @golemui/react @golemui/gui-react @golemui/gui-components @golemui/gui-shared
# Angular
npm i @golemui/core @golemui/angular @golemui/gui-angular @golemui/gui-components @golemui/gui-shared
# Vue
npm i @golemui/core @golemui/vue @golemui/gui-vue @golemui/gui-components @golemui/gui-shared
# Lit and vanilla JS
npm i @golemui/core @golemui/lit @golemui/gui-lit @golemui/gui-components @golemui/gui-shared
```

Import the two stylesheets once in the app entry, in this order, or the form renders unstyled:

```ts
import '@golemui/gui-components/index.css';
import '@golemui/gui-shared/forms.css';
```

### Render a form

A form is data: a JSON document whose `form` array holds the widget items. Pass the document, as
an object or as a string, as `formDef` to the framework component:

| Framework | Component                                                  | Submit event                          |
| --------- | ---------------------------------------------------------- | ------------------------------------- |
| React     | `<GuiForm>` from `@golemui/gui-react`                      | `formSubmit={(e) => e.data}`          |
| Angular   | `<gui-form>` (`FormComponent` from `@golemui/gui-angular`) | `(formSubmit)="onSubmit($event)"`     |
| Vue       | `<GuiForm>` from `@golemui/gui-vue`                        | `@form-submit="onSubmit"`             |
| Lit       | `<gui-form>` (import `@golemui/gui-lit`)                   | `@formSubmit=${(e) => e.detail.data}` |
| Vanilla   | `<gui-form>` (import `@golemui/gui-lit`)                   | `addEventListener('formSubmit', …)`   |

```tsx
import { GuiForm } from '@golemui/gui-react';

const formDef = {
  form: [
    {
      kind: 'input',
      type: 'textinput',
      path: 'email',
      label: 'Email',
      validator: { type: 'string', required: true, format: 'email' },
    },
    { kind: 'action', type: 'button', label: 'Sign up', actionType: 'submit' },
  ],
};

export const SignUp = () => (
  <GuiForm config={{ formDef }} formSubmit={(e) => console.log(e.data)} />
);
```

`formDef` is the whole document, never the bare widget array. Named `states` go in the document,
next to `form`. The [skill](skills/golemui/SKILL.md) holds the other rules that compile but fail
at runtime, each one tested under `specs/`.

Per-framework setup, server-side rendering and starter templates:
[Integrations](https://golemui.com/integration/overview/) and [`templates/`](templates/).

## Working on this repository

An Nx monorepo. Use the Node version in `.nvmrc` and npm 11 (an older npm rewrites the lockfile).

```bash
npm install
npm run build:libs   # build every package
npm run test:all     # run the test suite
npx nx run-many -t lint
npm run format
npx nx run react-playground:serve   # also angular-, vue-, lit-, nuxt-, nextjs-, astro-, analog-playground
```

### Packages

| Package                                   | What it is                                                         |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `libs/core`                               | The framework-agnostic forms engine                                |
| `libs/react`, `angular`, `vue`, `lit`     | Framework bindings of the engine, for building widget sets         |
| `libs/gui/shared`                         | The GolemUI widget set: the widget definitions and the form styles |
| `libs/gui/react`, `angular`, `vue`, `lit` | The form components apps render (`GuiForm`, `<gui-form>`)          |
| `libs/gui/components`                     | GolemUI Components, the web components the widgets render          |
| `libs/gui/validators`                     | Built-in and custom validators                                     |
| `libs/gui/schemas`, `libs/schemas`        | JSON Schemas for form definitions, and the tools to generate them  |
| `libs/gui/mcp`                            | The MCP server                                                     |
| `libs/lit-utils`                          | Internal helpers shared by the Lit packages                        |

### Conventions

- Imports flow one way: app, then framework, then gui, then core.
- No `export *`: explicit named re-exports in every `src/index.ts`, and `export type { }` for
  types.
- Symbols other packages need but users must not import go in `src/internals.ts`
  (`@golemui/<pkg>/internals`). Start there: promoting to public is non-breaking, demoting is not.
- A deprecation adds a row to [DEPRECATIONS.md](DEPRECATIONS.md) in the same PR, with what to use
  instead and the version that removes it.
- Commits and PR titles follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat(react): …`, `fix(gui-components): …`). PRs are squash merged.

[CONTRIBUTING.md](CONTRIBUTING.md) has the full setup, ports, server rendering checks and Cypress
tests.
