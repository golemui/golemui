<p align="center">
  <a href="https://golemui.com">
    <img src="docs/public/assets/gui-lockup.svg" alt="{gui.}" height="64">
  </a>
</p>

<p align="center"><strong>The Declarative Form Engine</strong></p>

<p align="center">JSON forms with a DX layer on top {gui.}. Best of both worlds.</p>

<p align="center">
  <a href="https://golemui.com/integration/react/" title="React"><img alt="React" src="https://cdn.simpleicons.org/react/61DAFB" height="44"></a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://golemui.com/integration/angular/" title="Angular"><img alt="Angular" src="https://cdn.simpleicons.org/angular/DD0031" height="44"></a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://golemui.com/integration/lit/" title="Lit"><img alt="Lit" src="https://cdn.simpleicons.org/lit/324FFF" height="44"></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@golemui/gui-shared"><img alt="npm" src="https://img.shields.io/npm/v/@golemui/gui-shared.svg"></a>
  <a href="https://github.com/golemui/golemui/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/npm/l/@golemui/gui-shared.svg"></a>
  <a href="https://golemui.com"><img alt="docs" src="https://img.shields.io/badge/docs-golemui.com-3b82f6"></a>
</p>
<p align="center">
  <a href="https://golemui.com/getting-started/installation/"><strong>Get started</strong></a> ·
  <a href="https://golemui.com">Documentation</a> ·
  <a href="https://golemui.com/form-definition/how-it-works/">How it works</a> ·
  <a href="https://golemui.com/integration/overview/">Integrations</a>
</p>

---

## The New Paradigm for forms

Underneath, every form is a serializable JSON schema. Portable, storable, framework-independent. On top, `{gui.}` is your DX layer: a typed, autocompletable builder that constructs that schema. You write `{gui.}`, you get JSON. **Best of both worlds: the portability of data, the ergonomics of typed code.**

```ts
import { gui } from '@golemui/gui-shared';

export const signupForm = [
  gui.inputs.textInput('email', {
    label: 'Email',
    validator: { type: 'string', required: true, format: 'email' },
  }),
  gui.inputs.password('password', {
    label: 'Password',
    validator: { type: 'string', required: true, minLength: 8 },
  }),
  gui.inputs.dropdown('accountType', {
    label: 'Account type',
    items: ['Free', 'Pro', 'Enterprise'],
    defaultValue: 'Free',
    validator: { type: 'string', required: true },
  }),
  gui.inputs.numberInput('seats', {
    label: 'Seats',
    validator: { type: 'number', required: true, minimum: 5, maximum: 1000 },
    include: { when: '$form.accountType === "Enterprise"' },
  }),
  gui.inputs.checkbox('terms', {
    label: 'I accept the terms of service',
    validator: { type: 'boolean', const: true },
  }),
  gui.actions.button({ label: 'Sign up', onClick: 'submit' }),
];
```

Conditional fields, validation, accessibility, and i18n come built in. The same schema renders in React, Angular, or Lit. No `useState`, no `register`, no `FormControl`.

[How it works →](https://golemui.com/form-definition/how-it-works/)

## Save tokens. Breeze through reviews.

`{gui.}` is small enough for your agent to emit cleanly, and small enough for your team to review at a glance. **Same code, both jobs.**

|                         | Lines | Branches | Tokens |
| ----------------------- | ----: | -------: | -----: |
| React + React Hook Form |    76 |        8 |    622 |
| `{gui.}`                |    35 |        0 |    366 |

The signup form above, measured. Tokens counted with `cl100k_base`.

## Install

```bash
# React → https://golemui.com/integration/react/
npm i @golemui/gui-react

# Angular → https://golemui.com/integration/angular/
npm i @golemui/gui-angular

# Lit → https://golemui.com/integration/lit/
npm i @golemui/gui-lit
```

Then import the styles once:

```scss
@import '@golemui/gui-components/index.css';
```

Full walkthrough at [golemui.com/getting-started/installation](https://golemui.com/getting-started/installation/).

## Your forms can live anywhere

- **Persist.** Store form definitions in any data store. Version them. Diff them. Roll them back. The same way you treat content.
- **Ship.** Marketers and ops teams can publish, update, and A/B test forms. No deploys, no engineering tickets.
- **Generate.** Ask a model for a form schema and render it instantly. Auto-build flows from a prompt, a doc, or a database column list.

## Three things every form needs. Already done.

- **Accessibility.** WCAG 2.1 AA, full keyboard navigation, semantic HTML, ARIA managed for you. Errors wired to `aria-describedby`. Screen-reader friendly out of the gate.
- **Internationalization.** Bring your own i18n library (i18next, Lingui, custom) through a simple adapter. Translate labels, hints, validators. Switch languages live. Automatic RTL. [→ docs](https://golemui.com/features/i18n/)
- **Validation.** Schema-driven, [`@standard-schema/spec`](https://standardschema.dev/) compliant. Built-in rules plus your own custom validators. Localized error messages with smart timing. [→ docs](https://golemui.com/features/validators/)

## Built for speed

|    Library Weight    |     LCP     | Lighthouse |
| :------------------: | :---------: | :--------: |
| **14.32 kB** gzipped | **0.19 ms** |  **100**   |

## Your brand. Your rules.

Design tokens, custom widgets, full theming control. Bring your own components when you need them; default widgets when you don't. [Theming guide →](https://golemui.com/styling/theming/)

## Documentation

[**golemui.com**](https://golemui.com) for full docs, API reference, per-framework guides, examples, and migration paths.

## Status

Approaching v1.0. Public launch at [DevBcn 2026](https://www.devbcn.com/) (16–17 June 2026, Barcelona).
