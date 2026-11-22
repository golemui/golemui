# GolemUI — Vue

Rendering a form in Vue, and server rendering it in Nuxt. The config, the events and the
runtime methods are in [config.md](config.md).

Setup:

```ts
declare function defineNuxtPlugin(setup: () => unknown): unknown;
declare function defineNuxtConfig(config: Record<string, unknown>): unknown;
```

## Install

```bash
npm i @golemui/core @golemui/vue @golemui/gui-vue @golemui/gui-components @golemui/gui-shared
```

## Render

```vue
<script setup lang="ts">
import type { FormEvent, FormSubmitEvent } from '@golemui/core';
import { GuiForm } from '@golemui/gui-vue';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import definition from './signup.form.json';

const config: GuiFormInitConfig = { formDef: definition };
const onSubmit = (event: FormSubmitEvent) => console.log(event.data);
const onEvent = (event: FormEvent) => console.log(event.name);
</script>

<template>
  <GuiForm :config="config" @form-submit="onSubmit" @form-event="onEvent" />
</template>
```

The events are kebab-case in Vue: `@form-submit`, `@form-event`, `@form-health`. The runtime
methods are on a template `ref` on `<GuiForm>`, typed `GuiFormHandle` from `@golemui/gui-vue`.

`<GuiForm>` needs no compiler config. Only a component of your own that writes a `gui-*` tag in
its template needs `vue: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('gui-') } }`
(see `vue-gui-tags-are-custom-elements`). In Nuxt, the GolemUI module sets it ("Nuxt").

Guide: https://golemui.com/json/integration/vue.md

## Nuxt

GolemUI has a Nuxt module, `@golemui/gui-components/nuxt` (see `nuxt-golemui-module`). It needs
the optional peer `@lit-labs/ssr`, 4.1.0 or later:

```bash
npm i @lit-labs/ssr@^4.1.0
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@golemui/gui-components/nuxt'],
  css: ['@golemui/gui-components/index.css', '@golemui/gui-shared/forms.css'],
});
```

- It makes Vue compile the `gui-*` tags as custom elements. `golemui: { prefixes: [...] }` in
  `nuxt.config.ts` adds the prefixes of a widget set of your own; the default is `['gui-']`.
- It fills in the insides of the `gui-*` elements in the server HTML: labels, inputs, buttons.
  `golemui: { serverRendering: false }` turns that off, and the server then sends the `gui-*`
  tags with their attributes and nothing inside, until the browser upgrades them.

Widgets load through dynamic imports, which a server render cannot wait for, so they are
preloaded before the first render on the server and on the client. In Nuxt that is a plugin,
`app/plugins/golemui.ts`:

```ts
import { preloadFormWidgets } from '@golemui/core';
import { widgetLoaders } from '@golemui/gui-vue';

export default defineNuxtPlugin(async () => {
  await preloadFormWidgets({ widgetLoaders });
});
```

The stylesheets go in the `css` of `nuxt.config.ts`, as above.

- `formName` is optional on Vue 3.5 and later: the adapter takes a stable id from `useId`, the
  same on the server and the client. Set it when the id in the markup must be predictable.
- The server renders the Vue layer (`<form>`, layouts, `gui-*` tags with their attributes and
  values), and the module the insides of the `gui-*` elements.

The rules every server render shares are in [ssr.md](ssr.md).

Starter: `templates/nuxt` in the GolemUI repository.

## Rules

### rule: nuxt-golemui-module

When: setting up GolemUI in a Nuxt app.

Do: add `'@golemui/gui-components/nuxt'` to the `modules` of `nuxt.config.ts`, and install `@lit-labs/ssr` 4.1.0 or later.

Wrong:

- Doing: leaving the module out of `nuxt.config.ts`.

  Because: the server HTML holds the `gui-*` tags with their attributes and nothing inside, no label and no input, until the browser upgrades them.

Applies: nuxt, vue, ssr

Source: libs/gui/components/src/nuxt.ts, libs/gui/components/src/nuxt-server-plugin.ts

### rule: vue-gui-tags-are-custom-elements

When: a Vue component of your own writes a `gui-*` tag in its template.

Do: tell the compiler the tag is a custom element, with `isCustomElement: (tag) => tag.startsWith('gui-')` (in Nuxt the GolemUI module does it), and bind object props with `.prop`.

Wrong:

- Doing: `<gui-select :options="list" />` with no `.prop`.

  Because: Vue sets an object it does not know as a prop of the element as an attribute, which turns it into a string.

Applies: vue, nuxt, gui-components

Source: libs/gui/components/src/nuxt.ts
