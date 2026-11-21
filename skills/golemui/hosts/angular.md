# GolemUI — Angular

Rendering a form in Angular, and server rendering it with `@angular/platform-server` or
Analog. The config, the events and the runtime methods are in [config.md](config.md).

Setup:

```ts
declare const definition: Record<string, unknown>;
```

## Install

```bash
npm i @golemui/core @golemui/angular @golemui/gui-angular @golemui/gui-components @golemui/gui-shared
```

## Render

`FormComponent` from `@golemui/gui-angular` goes in the `imports` of a standalone component,
and its selector is `<gui-form>`:

```ts
import { Component } from '@angular/core';
import type { FormEvent, FormSubmitEvent } from '@golemui/core';
import { FormComponent } from '@golemui/gui-angular';
import type { GuiFormInitConfig } from '@golemui/gui-shared';

@Component({
  selector: 'app-signup',
  imports: [FormComponent],
  template: `<gui-form
    [config]="config"
    (formSubmit)="onSubmit($event)"
    (formEvent)="onEvent($event)"
  ></gui-form>`,
})
export class SignupComponent {
  protected config: GuiFormInitConfig = { formDef: definition };
  onSubmit(event: FormSubmitEvent) {
    console.log(event.data);
  }
  onEvent(event: FormEvent) {
    console.log(event.name);
  }
}
```

The stylesheets can go in the `styles` of `angular.json`, by file path and in this order:
`node_modules/@golemui/gui-components/lib/styles/index.css`, then
`node_modules/@golemui/gui-shared/forms.css` (as `templates/angular` does). The runtime methods
are on `viewChild(FormComponent)`.

Guide: https://golemui.com/json/integration/angular.md

## Server rendering

Standard `@angular/platform-server`, with no GolemUI entry of its own. The widgets are preloaded
before bootstrap on the server and on the client, and both pass `provideClientHydration()`:

```ts no-check
import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-angular';

await preloadFormWidgets({ widgetLoaders });
// Server: renderApplication(bootstrap, { document }) with provideServerRendering() and
// provideClientHydration() in the providers.
// Client: bootstrapApplication(AppComponent, { providers: [provideClientHydration()] }).
```

- The server renders the form structure and the widgets Angular renders natively (tabs,
  grid). The insides of the `gui-*` elements stay empty until the browser upgrades them.
- Each `gui-*` element carries `defer-hydration`, which the first change detection on the
  client removes.

The rules every server render shares, `formName` among them, are in [ssr.md](ssr.md).

Starter: `templates/analog` in the GolemUI repository (Vite and Nitro, file-based routes). Its
`main.server.ts` awaits the preload before Analog's `render()`, and `main.ts` awaits it before
`bootstrapApplication`.

## Rules

### rule: angular-hydration-on-both-sides

When: server rendering GolemUI in Angular.

Do: pass `provideClientHydration()` in the providers of the server and of the client.

Wrong:

- Doing: `provideClientHydration()` on the client only.

  Because: the server needs it to write the hydration annotations into its HTML.

Applies: angular, ssr
