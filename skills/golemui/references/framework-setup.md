# GolemUI — install & framework wiring

The form definition is identical in every framework; only the host wiring changes.

## Install (4 packages, versions in lockstep)

```bash
# React
npm i @golemui/core @golemui/react @golemui/gui-react @golemui/gui-shared
# Angular
npm i @golemui/core @golemui/angular @golemui/gui-angular @golemui/gui-shared
# Vue
npm i @golemui/core @golemui/vue @golemui/gui-vue @golemui/gui-shared
# Lit AND vanilla JS (web component)
npm i @golemui/core @golemui/lit @golemui/gui-lit @golemui/gui-shared
```

Then import the component styles ONCE in the app entry (mandatory — without it the form
renders unstyled):

```ts
import '@golemui/gui-components/index.css';
```

## Submit event — per-framework matrix

Add `gui.actions.button({ label, actionType: 'submit' })` to the form, then listen on the host
component. The handler receives a `FormSubmitEvent` (type from `@golemui/core`); `.data` is the
collected form data. **Vue is the ONLY kebab-case event.**

| Framework | Component                                                  | Submit wiring                                             |
| --------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| React     | `<GuiForm>` from `@golemui/gui-react`                      | `formSubmit={(e: FormSubmitEvent) => e.data}`             |
| Angular   | `<gui-form>` (`FormComponent` from `@golemui/gui-angular`) | `(formSubmit)="onSubmit($event)"`                         |
| Vue       | `<GuiForm>` from `@golemui/gui-vue`                        | `@form-submit="onSubmit"`                                 |
| Lit       | `<gui-form>` (import `@golemui/gui-lit`)                   | `@formSubmit=${(e: CustomEvent) => e.detail.data}`        |
| Vanilla   | `<gui-form>` (import `@golemui/gui-lit`)                   | `el.addEventListener('formSubmit', (e) => e.detail.data)` |

## Render snippets

**React**

```tsx
import '@golemui/gui-components/index.css';
import { gui } from '@golemui/gui-shared';
import { GuiForm } from '@golemui/gui-react';
import type { FormSubmitEvent } from '@golemui/core';

<GuiForm config={{ formDef: form }} formSubmit={(e: FormSubmitEvent) => console.log(e.data)} />;
```

**Angular** — add `FormComponent` (from `@golemui/gui-angular`) to the standalone component's
`imports`, then:

```html
<gui-form [config]="{ formDef: form }" (formSubmit)="onSubmit($event)"></gui-form>
```

**Vue**

```vue
<GuiForm :config="{ formDef: form }" @form-submit="onSubmit" />
```

**Vue SSR (Nuxt)** — same packages and component. Widgets load through dynamic imports, which a
server render cannot wait for, so preload them before the first render on BOTH the server and
the client. In Nuxt that is a plugin (`app/plugins/golemui.ts`):

```ts
import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-vue';

export default defineNuxtPlugin(async () => {
  await preloadFormWidgets({ widgetLoaders });
});
```

Load the stylesheet through `css: ['@golemui/gui-components/index.css']` in `nuxt.config.ts`
(nothing is injected). Rules that follow from the preload:

- Custom widgets: keep their loaders in ONE module-scope object, spread it into the preload call
  and pass the same object as `customWidgetLoaders` — the registry caches by loader function
  identity, so an object literal recreated per component misses the cache.
- `formName` is optional on Vue ≥ 3.5 (the adapter derives a stable id on both sides); set it
  when the id in the markup must be predictable.
- `<GuiForm>` needs no compiler config. Only a component of your own that places a `gui-*` tag
  in its template needs `vue: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('gui-') } }`,
  and object props on such a tag must be bound with `.prop` (an attribute would stringify them).
- `onLoad`, like every handler, runs in the browser only — never during the server render.
- The server renders the Vue layer (`<form>`, layouts, `gui-*` tags with their attributes and
  values); the Lit `gui-*` elements render their internals once the browser upgrades them.

Starter: `templates/nuxt` in the GolemUI repo.

**Lit** — `import '@golemui/gui-lit'` registers the `<gui-form>` custom element:

```ts
html`<gui-form
  .config=${{ formDef: form }}
  @formSubmit=${(e: CustomEvent) => e.detail.data}
></gui-form>`;
```

**Vanilla JS**

```ts
import '@golemui/gui-lit';
import type { FormElement } from '@golemui/gui-lit';

const el = document.querySelector<FormElement>('gui-form');
if (el) {
  el.config = { formDef: form };
  el.addEventListener('formSubmit', (e) => console.log((e as CustomEvent).detail.data));
}
```

(In TypeScript the `FormElement` type parameter is required: the published types do not
register `gui-form` in `HTMLElementTagNameMap`, so an untyped `querySelector` yields
`Element` and `el.config` fails to compile. In plain JavaScript, drop the types.)

In every case `formDef` is the bare array; form-wide config goes in the sibling
`formConfig` (`config={{ formDef, formConfig: { states, validateOn } }}`). `validateOn` is one
of `eager` | `change` | `blur` | `submit`. There is also a `formHealth` callback/event
(validity reporting) and a `formEvent` event for host-dispatched widget events.

## Full component reference

Everything `<gui-form>`/`<GuiForm>` accepts (data inputs, selector/engine config, callbacks) —
the single biggest API page:

- TS: https://golemui.com/dx/integration/configuration.md
- JSON: https://golemui.com/json/integration/configuration.md

Per-framework guides: `https://golemui.com/dx/integration/{react|angular|vue|lit|vanilla}.md`
