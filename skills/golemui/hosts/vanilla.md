# GolemUI — vanilla JS

Rendering a form with no framework, through the `<gui-form>` custom element. The config, the
events and the runtime methods are in [config.md](config.md).

Setup:

```ts
declare const definition: Record<string, unknown>;
```

## Install

```bash
npm i @golemui/core @golemui/lit @golemui/gui-lit @golemui/gui-components @golemui/gui-shared
```

## Render

```html
<gui-form></gui-form>
```

```ts
import '@golemui/gui-components/index.css';
import '@golemui/gui-shared/forms.css';
import '@golemui/gui-lit';
import type { FormElement } from '@golemui/gui-lit';

const el = document.querySelector<FormElement>('gui-form');
if (el) {
  el.config = { formDef: definition };
  el.addEventListener('formSubmit', (e) => console.log((e as CustomEvent).detail.data));
  el.addEventListener('formEvent', (e) => console.log((e as CustomEvent).detail.name));
}
```

In plain JavaScript, drop the types. The runtime methods are on the element itself.

Guide: https://golemui.com/json/integration/vanilla.md

## Rules

### rule: vanilla-typed-query-selector

When: reaching `<gui-form>` from TypeScript.

Do: pass the element type to the query: `document.querySelector<FormElement>('gui-form')`, with `FormElement` from `@golemui/gui-lit`.

Wrong:

- Doing: `document.querySelector('gui-form')` and then `el.config = ...`.

  Because: the types do not register `gui-form` in `HTMLElementTagNameMap`, so the query returns an `Element`, and TypeScript reports that `config` does not exist on it.

Applies: vanilla, typescript

Source: libs/gui/lit/src/lib/components/form.element.ts#FormElement
