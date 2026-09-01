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
# Lit server rendering (Astro, plain Node) additionally needs the optional peer:
npm i @lit-labs/ssr
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

**React SSR (Next.js App Router)** — same packages and component. Widgets load through dynamic
imports, which a server render cannot wait for, so preload them before the first render on BOTH
the server and the client. In Next.js that is a client component that suspends on a module-scope
promise (`src/app/golemui-provider.tsx`), wrapped around `{children}` in the root layout:

```tsx
'use client';
import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-react';
import { use, type ReactNode } from 'react';

const preloadPromise = preloadFormWidgets({ widgetLoaders }); // one per environment

export function GolemuiProvider({ children }: { children: ReactNode }) {
  use(preloadPromise); // server: waits before emitting HTML; client: waits before hydrating
  return <>{children}</>;
}
```

Rules that follow from it:

- Pages that render `<GuiForm>` are client components (`'use client'`): the config holds functions.
  Keep `config` at module scope (a new identity per render re-initializes the form).
- Set `formName` — the server and the client must produce the same form id.
- Custom widgets: ONE module-scope loaders object, spread into the preload call and passed as
  `customWidgetLoaders` in every form config (the registry caches by loader function identity).
- Import `@golemui/gui-components/index.css` once in the root layout; nothing is injected.
- A `gui-*` tag placed directly in JSX takes object props as properties in React 19
  (`<gui-select options={list} onChange={…} />`).
- The server renders the React layer (`<form>`, layouts, `gui-*` tags with their attributes and
  values); the Lit `gui-*` elements render their internals once the browser upgrades them.

Starter: `templates/nextjs` in the GolemUI repo.

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

**Lit SSR (Astro, or any Node server)** — unlike the Vue and React hosts, this renders the WHOLE
form on the server, widget internals included (inputs, labels, values are in the HTML), through
the server-only subpath `@golemui/lit/ssr` (needs `@lit-labs/ssr`). The client does not hydrate
that markup: it replaces it with one live render before the next paint. Keep the form config in a
module both sides import; nothing in it may touch the DOM.

Server (Astro frontmatter, or a request handler):

```ts
import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-lit'; // also registers <gui-form>
import { renderGuiHtml } from '@golemui/lit/ssr';
import { html } from 'lit';
import { config } from './form'; // MUST set formName

await preloadFormWidgets({ widgetLoaders }); // the render is synchronous: no awaiting loaders
const formHtml = await renderGuiHtml(html`<gui-form .config=${config}></gui-form>`);
// Astro: <Fragment set:html={formHtml} />. Every element carries `defer-hydration` and stays inert.
```

Client (Astro `<script>`, or the page's module):

```ts
import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders, type FormElement } from '@golemui/gui-lit';
import { initValidators } from '@golemui/gui-validators';
import { resumeServerRenderedForm, type FormElement as CoreFormElement } from '@golemui/lit';
import { config } from './form';

await preloadFormWidgets({ widgetLoaders }); // same preload, or the first render resolves no widgets
const form = document.querySelector<FormElement>('gui-form')!;
form.addEventListener('formSubmit', (e) => console.log((e as CustomEvent).detail.data)); // BEFORE the resume
resumeServerRenderedForm(form as unknown as CoreFormElement, {
  config: config as never, // typed for the core element; <gui-form> follows the same contract
  validators: initValidators(), // <gui-form> builds its own; the value is ignored
});
```

Rules that follow from it:

- `formName` is mandatory (the server render throws without it).
- Listeners and properties (`formHealthBoundary`, `autocomplete`) go on the element BEFORE
  `resumeServerRenderedForm`; the resume removes `defer-hydration`, which triggers the render.
- Custom widgets must be registered with `safeDefine('my-tag', MyElement)` from `@golemui/lit`,
  NOT `@customElement`/`customElements.define`: only safeDefine-registered elements run
  `connectedCallback` on the server and honor `defer-hydration` on the client. Their loaders: ONE
  module-scope object, spread into both preload calls and passed as `customWidgetLoaders`.
- `@golemui/lit/ssr` has no browser build; import it only in server code.
- `onLoad`, `onChange` and every other handler run in the browser only.

Starter: `templates/astro` in the GolemUI repo (`output: 'server'` + `@astrojs/node`; the same
code prerenders at build time under Astro's default static output).

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

SSR starters in the GolemUI repo: `templates/nextjs` (React), `templates/nuxt` (Vue),
`templates/astro` (Lit).
