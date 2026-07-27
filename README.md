<p align="center">
  <a href="https://golemui.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset=".github/assets/gui-lockup-dark.png">
      <img src=".github/assets/gui-lockup-light.png" alt="{gui.} GolemUI" height="64">
    </picture>
  </a>
</p>

<p align="center">The one stop shop for JS forms.</p>

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

---

## Overview

Define forms with the typed `gui` builder API, or as schema-validated JSON. Both produce the same serializable definition.

- One definition renders in React, Angular, Lit, Vue, or vanilla JS.
- Validation, conditional fields, i18n, and accessibility come from the schema and runtime.
- The output is plain data: store it, transfer it, diff it, generate it.

## Installation

Install the four `@golemui/*` packages for your framework. The versions are published together; use matching versions.

```bash
# React
npm i @golemui/core @golemui/react @golemui/gui-react @golemui/gui-shared

# Angular
npm i @golemui/core @golemui/angular @golemui/gui-angular @golemui/gui-shared

# Lit
npm i @golemui/core @golemui/lit @golemui/gui-lit @golemui/gui-shared

# Vue
npm i @golemui/core @golemui/vue @golemui/gui-vue @golemui/gui-shared

# Vanilla JS (web component)
npm i @golemui/core @golemui/lit @golemui/gui-lit @golemui/gui-shared
```

Import the component styles once, anywhere in your app entry:

```scss
@import '@golemui/gui-components/index.css';
```

Full walkthrough at [golemui.com/getting-started/installation](https://golemui.com/getting-started/installation/).

## Quick start

Define a form as an array of `gui` builders and pass it to the framework component (React shown):

```tsx
import '@golemui/gui-components/index.css';
import type { FormSubmitEvent } from '@golemui/core';
import { GuiForm } from '@golemui/gui-react';
import { gui } from '@golemui/gui-shared';

const formDef = [
  gui.inputs.textInput('email', {
    label: 'Email',
    validator: { type: 'string', required: true, format: 'email' },
  }),
  gui.inputs.password('password', {
    label: 'Password',
    validator: { type: 'string', required: true, minLength: 8 },
  }),
  gui.inputs.checkbox('newsletter', {
    label: 'Subscribe to the newsletter',
    include: { when: '!!$form.email' },
  }),
  gui.actions.button({
    label: 'Sign up',
    actionType: 'submit',
    disabled: { when: '$formIsInvalid' },
  }),
];

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

**Form definition.** A form is an array of nodes (or a single node). Each node is either a `gui` builder result or a render function. The output is serializable JSON, so a definition can be stored, transferred, and rendered later.

**The `gui` builder.** Exported from `@golemui/gui-shared`, grouped into namespaces:

| Namespace       | Purpose                                               | Examples                                                                                                                                                                                                     |
| --------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gui.inputs`    | Field widgets                                         | `textInput`, `numberInput`, `password`, `textarea`, `checkbox`, `dropdown`, `select`, `radiogroup`, `currency`, `tags`, `datePicker`, `timeInput`, `dateTimeInput`, `calendar`, `repeater`, `list`, `custom` |
| `gui.actions`   | Buttons and custom actions                            | `button`, `custom`                                                                                                                                                                                           |
| `gui.displays`  | Non-input content                                     | `display`, `alert`, `markdownText`, `custom`                                                                                                                                                                 |
| `gui.layouts`   | Containers                                            | `flex`, `grid`, `tabs`, `accordion`, `custom`                                                                                                                                                                |
| `gui.selectors` | Select and update widgets by type, uid, tag, or state | -                                                                                                                                                                                                            |

**Conditional fields.** Widgets accept `include` / `exclude` with a reactive expression over form data:

```ts
gui.inputs.radiogroup('city', { label: 'City', include: { when: '!!$form.country' } });
gui.actions.button({ label: 'Reset', include: { when: '$form.debug === true' } });
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
- **AI assistants (MCP).** `@golemui/gui-mcp` ships a `golemui-mcp` Model Context Protocol server with tools to validate form definitions, generate them from JSON Schema or OpenAPI, and type-check `gui.*` code.

## Packages

| Package                                             | Description                                                                  |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| `@golemui/gui-react` / `-angular` / `-lit` / `-vue` | Framework form component and bindings                                        |
| `@golemui/gui-shared`                               | The `gui` builder and form definition types (`GuiFormInitConfig`)            |
| `@golemui/gui-components`                           | Default widget components and the stylesheet (`index.css`)                   |
| `@golemui/core`                                     | Framework-agnostic form runtime and shared types (`FormEvent`, `ValidateOn`) |
| `@golemui/gui-validators`                           | Validation schemas (`@standard-schema/spec`)                                 |
| `@golemui/gui-schemas`                              | JSON Schemas for form definitions                                            |
| `@golemui/gui-mcp`                                  | MCP server for coding assistants                                             |

Import only from a package's public entry points. The `@golemui/*/internals` paths are internal and unstable.

## Documentation

[**golemui.com**](https://golemui.com) for full docs, API reference, per-framework guides, examples, and migration paths.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The repository is an Nx monorepo; tests run on Vitest, and pull requests follow Conventional Commits.

## License

[MIT](LICENSE)
