<p align="center">
  <a href="https://golemui.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset=".github/assets/gui-lockup-dark.png">
      <img src=".github/assets/gui-lockup-light.png" alt="{gui.} GolemUI" height="64">
    </picture>
  </a>
</p>

<h3 align="center">The dynamic forms engine.</h3>
<p align="center">Define forms in JSON or JSON Schema. Render them with your favorite framework.</p>

<p align="center">
  <a href="https://golemui.com/integration/react/" title="React"><img alt="React" src="https://cdn.simpleicons.org/react/61DAFB" height="44"></a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://golemui.com/integration/angular/" title="Angular"><img alt="Angular" src="https://cdn.simpleicons.org/angular/DD0031" height="44"></a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://golemui.com/integration/lit/" title="Lit"><img alt="Lit" src="https://cdn.simpleicons.org/lit/324FFF" height="44"></a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://golemui.com/integration/vue/" title="Vue"><img alt="Vue" src="https://cdn.simpleicons.org/vuedotjs/4FC08D" height="44"></a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://golemui.com/integration/overview/" title="Vanilla JS"><img alt="JavaScript" src="https://cdn.simpleicons.org/javascript/F7DF1E" height="44"></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@golemui/gui-shared"><img alt="npm" src="https://img.shields.io/npm/v/@golemui/gui-shared.svg"></a>
  <a href="https://github.com/golemui/golemui/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/npm/l/@golemui/gui-shared.svg"></a>
  <a href="https://golemui.com"><img alt="docs" src="https://img.shields.io/badge/docs-golemui.com-c15a2c"></a>
</p>
<p align="center">
  <a href="https://golemui.com/getting-started/installation/"><strong>Get started</strong></a> ·
  <a href="https://golemui.com">Documentation</a> ·
  <a href="https://golemui.com/form-definition/how-it-works/">How it works</a> ·
  <a href="https://golemui.com/integration/overview/">Integrations</a>
</p>

> [!NOTE]
> The `main` branch is the development branch of the next major version. `npm install` installs version 2.x, and [golemui.com](https://golemui.com) documents version 2.x. Version 2.x gets bug fixes and security fixes. The code of the latest 2.x release is at the tag [`v2.3.0`](https://github.com/golemui/golemui/tree/v2.3.0). To install the agent skill for 2.x, run `npx skills add golemui/golemui@v2.3.0`.

---

## Overview

Define forms as schema-validated JSON documents.

- One definition renders in React, Angular, Lit, Vue, or vanilla JS.
- Validation, conditional fields, i18n, and accessibility come from the schema and runtime.
- The output is plain data: store it, transfer it, diff it, generate it.

## Installation

Install the five `@golemui/*` packages for your framework. The versions are published together; use matching versions.

```bash
# React
npm i @golemui/core @golemui/react @golemui/gui-react @golemui/gui-components @golemui/gui-shared

# Angular
npm i @golemui/core @golemui/angular @golemui/gui-angular @golemui/gui-components @golemui/gui-shared

# Lit
npm i @golemui/core @golemui/lit @golemui/gui-lit @golemui/gui-components @golemui/gui-shared

# Vue
npm i @golemui/core @golemui/vue @golemui/gui-vue @golemui/gui-components @golemui/gui-shared

# Vanilla JS (web component)
npm i @golemui/core @golemui/lit @golemui/gui-lit @golemui/gui-components @golemui/gui-shared
```

Import the two stylesheets once, in this order, anywhere in your app entry:

```scss
@import '@golemui/gui-components/index.css';
@import '@golemui/gui-shared/forms.css';
```

Full walkthrough at [golemui.com/getting-started/installation](https://golemui.com/getting-started/installation/).

## Quick start

Define a form as a JSON document and pass it to the framework component (React shown):

```tsx
import '@golemui/gui-components/index.css';
import '@golemui/gui-shared/forms.css';
import type { FormSubmitEvent } from '@golemui/core';
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
    {
      kind: 'input',
      type: 'password',
      path: 'password',
      label: 'Password',
      validator: { type: 'string', required: true, minLength: 8 },
    },
    {
      kind: 'input',
      type: 'checkbox',
      path: 'newsletter',
      label: 'Subscribe to the newsletter',
      include: { when: '!!$form.email' },
    },
    {
      kind: 'action',
      type: 'button',
      label: 'Sign up',
      actionType: 'submit',
      disabled: { when: '$formIsInvalid' },
    },
  ],
};

function handleSubmit(event: FormSubmitEvent) {
  console.log(event.data);
}

export function App() {
  return <GuiForm config={{ formDef }} formSubmit={handleSubmit} />;
}
```

The submit button stays disabled while the form is invalid (`$formIsInvalid` is a built-in validity flag); on submit, `formSubmit` receives the collected `data`.

The same `formDef` value renders in every supported framework. See [Integrations](https://golemui.com/integration/overview/) for per-framework setup, and the starter templates under [`templates/`](templates/) for runnable examples.

## Core concepts

**Form definition.** A form is a JSON document. Its `form` array holds the widgets, and its optional `states` object holds named conditions. A definition can be stored, transferred, and rendered later.

**Widgets.** Each widget has a `kind` and a `type`. An input widget also has a `path`, the key of its value in the form data:

| Kind      | Purpose           | Types (examples)                                                                                                                                                                              |
| --------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`   | Field widgets     | `textinput`, `number`, `password`, `textarea`, `checkbox`, `dropdown`, `select`, `radiogroup`, `currency`, `tags`, `datePicker`, `timeInput`, `dateTimeInput`, `calendar`, `repeater`, `list` |
| `action`  | Buttons and menus | `button`, `menuButton`                                                                                                                                                                        |
| `display` | Non-input content | `alert`, `markdownText`                                                                                                                                                                       |
| `layout`  | Containers        | `grid`, `tabs`, `accordion`                                                                                                                                                                   |

A custom widget has its own `type`, registered through `customWidgetLoaders`.

**Conditional fields.** Widgets accept `include` / `exclude` with a reactive expression over form data:

```json
{
  "form": [
    {
      "kind": "input",
      "type": "radiogroup",
      "path": "city",
      "label": "City",
      "include": { "when": "!!$form.country" }
    },
    {
      "kind": "action",
      "type": "button",
      "label": "Reset",
      "include": { "when": "$form.debug === true" }
    }
  ]
}
```

`$form.<path>` reads the current form data; the expression is evaluated at runtime.

**Rendering per framework.** Every adapter takes the definition through a `config` prop and emits a form submit event:

| Framework | Import                                                 | Element                                                       |
| --------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| React     | `import { GuiForm } from '@golemui/gui-react'`         | `<GuiForm config={config} formSubmit={handler} />`            |
| Vue       | `import { GuiForm } from '@golemui/gui-vue'`           | `<GuiForm :config="config" @form-submit="handler" />`         |
| Angular   | `import { FormComponent } from '@golemui/gui-angular'` | `<gui-form [config]="config" (formSubmit)="handler($event)">` |
| Lit       | `import '@golemui/gui-lit'`                            | `<gui-form .config=${config} @formSubmit=${handler}>`         |

For vanilla JS, import `@golemui/gui-lit` to register the `<gui-form>` custom element, then set `el.config = config` and listen for the `formSubmit` event (`e.detail` is the `FormSubmitEvent`).

## Features

- **Validation.** [`@standard-schema/spec`](https://standardschema.dev/) compliant. Built-in `string`, `number`, `boolean`, `array`, and `custom` validators with rules such as `required`, `minLength`, `format`, `minimum`/`maximum`, and `const`. Error messages are localizable, and timing is configurable via `validateOn` (`change`, `blur`, `submit`, `eager`). [Docs](https://golemui.com/features/validators/)
- **Internationalization.** Provide an `I18nTranslator` adapter (i18next, Lingui, or your own) through `localization`. Labels, hints, and validator messages are translatable, with live language switching and automatic RTL. [Docs](https://golemui.com/features/i18n/)
- **Accessibility.** Native form elements with ARIA wiring managed for you: `aria-describedby` for hints, `aria-invalid` and `aria-errormessage` on errors, plus keyboard navigation on interactive widgets.
- **Theming.** Styling is driven by CSS custom properties (design tokens) from a single stylesheet. Override tokens, or supply your own widget components through `customWidgetLoaders`. [Docs](https://golemui.com/styling/theming/)
- **AI assistants (MCP).** `@golemui/gui-mcp` ships a `golemui-mcp` Model Context Protocol server with tools to validate form definitions and generate them from JSON Schema or OpenAPI.
- **AI assistants (skill).** An installable [agent skill](./skills/golemui/SKILL.md) grounds coding agents in the real GolemUI API even without the MCP connected - `npx skills add golemui/golemui@v2.3.0` (works with Claude Code, Cursor, and other [skills.sh](https://skills.sh)-compatible agents).

## Packages

| Package                                             | Description                                                                         |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `@golemui/gui-react` / `-angular` / `-lit` / `-vue` | Framework form component and bindings                                               |
| `@golemui/gui-shared`                               | The widget definitions, form definition types (`GuiFormInitConfig`) and `forms.css` |
| `@golemui/gui-components`                           | Lit web components, usable with or without forms, and their stylesheets             |
| `@golemui/core`                                     | Framework-agnostic form runtime and shared types (`FormEvent`, `ValidateOn`)        |
| `@golemui/gui-validators`                           | Validation schemas (`@standard-schema/spec`)                                        |
| `@golemui/schemas`                                  | The shared core JSON Schema (common defs) and the schema tree generator             |
| `@golemui/gui-schemas`                              | JSON Schemas for gui form definitions, generated from the widget manifest           |
| `@golemui/gui-mcp`                                  | MCP server for coding assistants                                                    |

Import only from a package's public entry points. The `@golemui/*/internals` paths are internal and unstable.

## Documentation

[**golemui.com**](https://golemui.com) for full docs, API reference, per-framework guides, examples, and migration paths.

Upgrading from 1.x? See [MIGRATION-v2.md](MIGRATION-v2.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The repository is an Nx monorepo; tests run on Vitest, and pull requests follow Conventional Commits.

## License

[MIT](LICENSE)
