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

**React SSR** - same packages and component. Widgets load through dynamic imports, which a
server render cannot wait for, so preload them before the render on BOTH the server and the
client:

```tsx
import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-react';

await preloadFormWidgets({ widgetLoaders });
// Server: renderToString(<App />). Client: hydrateRoot(container, <App />).
```

- Set an explicit `formName`. The default id comes from React's `useId`, which matches across
  server and client but is not predictable in the markup.
- Handlers (`onLoad`, `formSubmit`, ...) run in the browser only - never during a server render.
- The server renders the form structure and bare `gui-*` tags carrying `defer-hydration`. The
  attribute holds the elements empty until React hydrates and removes it, so the page stays
  identical to the server response. Widget internals and values appear when the elements
  upgrade on the client.
- Next.js App Router: run the preload in the client component module that renders the form. A
  preload awaited in a Server Component fills a different module graph than the one the client
  component's server render reads.

**Angular** — add `FormComponent` (from `@golemui/gui-angular`) to the standalone component's
`imports`, then:

```html
<gui-form [config]="{ formDef: form }" (formSubmit)="onSubmit($event)"></gui-form>
```

**Angular SSR** - standard `@angular/platform-server`, no GolemUI-specific server entry.
Preload before bootstrap on BOTH the server and the client, and pass
`provideClientHydration()` on both sides (the server needs it to emit the hydration
annotations):

```ts
import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-angular';

await preloadFormWidgets({ widgetLoaders });
// Server: renderApplication(bootstrap, { document }) with provideServerRendering() and
// provideClientHydration() in the providers.
// Client: bootstrapApplication(AppComponent, { providers: [provideClientHydration()] }).
```

- Set an explicit `formName` - required for SSR. Without one the server and the client mint
  different random ids (hydration still succeeds, but the markup id is not predictable).
- Handlers run in the browser only - never during a server render.
- The server renders the form structure and the native Angular widget internals (tabs, flex,
  grid). `gui-*` element internals stay empty until the browser upgrades them. Each `gui-*`
  element carries `defer-hydration`, removed by the first client change detection pass.
- A widget that was not preloaded logs a warning during a server render and renders empty.

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

**Lit SSR (experimental)** - the server renders the COMPLETE widget markup (internals,
labels, and values included) through `@lit-labs/ssr` (install it yourself, >= 4.1.0, an
optional peer of `@golemui/lit`). The client does not hydrate that markup: it stays inert
under `defer-hydration` until `resumeServerRenderedForm` replaces it with one live render
before the next paint.

```ts
// Server (after preloadFormWidgets with the gui-lit widgetLoaders)
import { renderGuiFormHtml } from '@golemui/lit/ssr';
const html = await renderGuiFormHtml({ config, validators });

// Client (after the same preload)
import { resumeServerRenderedForm, type FormElement } from '@golemui/lit';
const form = document.querySelector('gui-form') as unknown as FormElement;
resumeServerRenderedForm(form, { config, validators });
```

- `formName` is required: `renderGuiFormHtml` throws without it.
- `renderGuiHtml` (same entry) renders a whole lit template around the form instead of just
  the form. Driving `@lit-labs/ssr`'s own `render()` directly requires `GuiSsrElementRenderer`
  (from `@golemui/lit/ssr`) in `elementRenderers`, or the form context never reaches the
  widgets.
- Handlers run in the browser only - `load` fires after the resume.
- Known limitations of the experimental tier: a false boolean property serializes as
  `selected="false"`, which HTML reads as true until the resume corrects it. A widget that
  assigns its input value imperatively (the number widget) renders without its value. Calendar
  widgets read the server clock, so their markup depends on when the server rendered.

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

## SSR rules shared by every framework

- Keep custom widget loaders in ONE module-scope object, reused by the preload call and the
  form config. The registry caches by loader function identity, so an object literal recreated
  per component misses the cache.
- The registry cache is process-global and shared across requests. That is safe (the entries
  are widget modules), and it means one preload warms every later render in the process.
- Anything passed as `dependencies` (for example a markdown parser) must work in Node and
  produce the same output on the server and the client.
- Validation runs on triggers and error display waits for `touched`, so a server render of an
  untouched form never contains error markup.
- Server runtime: Node 20 or newer (CI tests on Node 22). Runtimes with standard `crypto` and
  `Intl` are expected to work but are not tested.

## Full component reference

Everything `<gui-form>`/`<GuiForm>` accepts (data inputs, selector/engine config, callbacks) —
the single biggest API page:

- TS: https://golemui.com/dx/integration/configuration.md
- JSON: https://golemui.com/json/integration/configuration.md

Per-framework guides: `https://golemui.com/dx/integration/{react|angular|vue|lit|vanilla}.md`
