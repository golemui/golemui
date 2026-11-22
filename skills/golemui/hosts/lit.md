# GolemUI — Lit

Rendering a form in a Lit template, and server rendering it in Astro or any Node server. The
config, the events and the runtime methods are in [config.md](config.md). Without Lit, the same
element is in [vanilla.md](vanilla.md).

Setup:

```ts
import { html } from 'lit';
declare const definition: Record<string, unknown>;
```

## Install

```bash
npm i @golemui/core @golemui/lit @golemui/gui-lit @golemui/gui-components @golemui/gui-shared
# server rendering also needs the optional peer, 4.1.0 or later:
npm i @lit-labs/ssr@^4.1.0
```

## Render

`import '@golemui/gui-lit'` registers the `<gui-form>` element. It renders in the light DOM,
so its styles are the two stylesheets of the document. A Lit element that holds it renders in
the light DOM too (see `lit-host-in-light-dom`):

```ts
import '@golemui/gui-lit';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('signup-form')
export class SignupForm extends LitElement {
  protected config: GuiFormInitConfig = { formDef: definition };

  override createRenderRoot() {
    return this;
  }

  override render() {
    return html`<gui-form
      .config=${this.config}
      @formSubmit=${(e: CustomEvent) => console.log(e.detail.data)}
      @formEvent=${(e: CustomEvent) => console.log(e.detail.name)}
    ></gui-form>`;
  }
}
```

The runtime methods are on the `<gui-form>` element itself.

Guide: https://golemui.com/json/integration/lit.md

## Server rendering

This renders the whole form on the server, the insides of the widgets included (inputs,
labels, values are in the HTML), through the server-only entry `@golemui/lit/ssr`. The client
does not hydrate that markup: it replaces it with one live render before the next paint. The
form config lives in a module both sides import, and nothing in it may touch the DOM.

Server (Astro frontmatter, or a request handler):

```ts no-check
import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-lit'; // also registers <gui-form>
import { renderTemplate } from '@golemui/lit/ssr';
import { html } from 'lit';
import { config } from './form'; // sets formName

await preloadFormWidgets({ widgetLoaders }); // the render is synchronous: no awaiting loaders
const formHtml = await renderTemplate(html`<gui-form .config=${config}></gui-form>`);
// Astro: <Fragment set:html={formHtml} />. Every element carries `defer-hydration` and stays inert.
```

Client (an Astro `<script>`, or the page's module):

```ts no-check
import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders, type FormElement } from '@golemui/gui-lit';
import { initValidators } from '@golemui/gui-validators';
import { resumeServerRenderedForm, type FormElement as CoreFormElement } from '@golemui/lit';
import { config } from './form';

await preloadFormWidgets({ widgetLoaders }); // same preload, or the first render resolves no widgets
const form = document.querySelector<FormElement>('gui-form')!;
form.addEventListener('formSubmit', (e) => console.log((e as CustomEvent).detail.data)); // before the resume
resumeServerRenderedForm(form as unknown as CoreFormElement, {
  config: config as never, // typed for the core element; <gui-form> follows the same contract
  validators: initValidators(), // <gui-form> builds its own; the value is ignored
});
```

- `renderForm({ config, validators })`, from the same entry, renders one form without a
  template around it. `renderTemplate` is the general entry point. `renderForm` throws without
  a `formName`; `renderTemplate` does not check it.
- `@golemui/lit/ssr` has no browser build.
- Calendar widgets read the server's clock, so their markup depends on when the server
  rendered.

The rules every server render shares are in [ssr.md](ssr.md).

Starter: `templates/astro` in the GolemUI repository (`output: 'server'` with `@astrojs/node`;
the same code prerenders at build time under Astro's default static output).

## Rules

### rule: lit-host-in-light-dom

When: a Lit element of your own renders `<gui-form>` in its template.

Do: make the element render in the light DOM, with `override createRenderRoot() { return this; }`.

Wrong:

- Doing: leaving the element's default shadow root.

  Because: the document's stylesheets do not reach inside a shadow root, and the form renders with the browser's defaults: a 2px inset border on the input, Arial, a grey button.

Applies: lit, styling

Source: libs/lit/src/lib/components/form/form.element.ts#FormElement

### rule: lit-listeners-before-resume

When: resuming a server-rendered form on the client.

Do: add the listeners and set the properties (`formHealthBoundary`, `autocomplete`) on `<gui-form>` before calling `resumeServerRenderedForm`.

Wrong:

- Doing: calling `resumeServerRenderedForm` first and adding the `formSubmit` listener after it.

  Because: the resume removes `defer-hydration`, which runs the held `connectedCallback` and starts the form; events sent before the listener exists are lost.

Applies: lit, astro, ssr, events

Source: libs/lit/src/lib/ssr/resume.ts#resumeServerRenderedForm

### rule: lit-custom-widgets-with-safedefine

When: registering a custom widget element for a server-rendered Lit form.

Do: register it with `safeDefine('my-tag', MyElement)` from `@golemui/lit`.

Wrong:

- Doing: `@customElement('my-tag')` or `customElements.define('my-tag', MyElement)`.

  Because: only an element registered with `safeDefine` runs `connectedCallback` on the server and keeps `defer-hydration` on the client.

Applies: lit, astro, ssr, custom-widgets

Source: libs/lit-utils/src/lib/define.ts#safeDefine

### rule: lit-ssr-server-only

When: importing `@golemui/lit/ssr`.

Do: import it only in server code.

Wrong:

- Doing: importing `renderTemplate` in a module the browser loads.

  Because: `@golemui/lit/ssr` has no browser build.

Applies: lit, astro, ssr

Source: libs/lit/src/ssr.ts
