# @golemui/gui-vue

The default widget set for [GolemUI](https://golemui.com) on Vue 3. Pairs with [`@golemui/vue`](../../vue/) (the framework adapter) and consumes the framework-agnostic Lit widgets from `@golemui/gui-components`.

## Install

```bash
npm i @golemui/gui-vue @golemui/vue @golemui/core
```

## Vite configuration

GolemUI widgets render through Lit custom elements internally (`<gui-textinput>`, `<gui-button>`, …). Tell the Vue template compiler to leave the `gui-*` tags alone:

```ts
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('gui-'),
        },
      },
    }),
  ],
});
```

## Usage

```vue
<script setup lang="ts">
import { GuiForm } from '@golemui/gui-vue';
import type { GuiFormInitConfig } from '@golemui/gui-shared';

const config: GuiFormInitConfig = {
  formDef: {
    form: {
      kind: 'layout',
      type: 'flex',
      children: [
        { kind: 'input', type: 'textinput', path: 'email', label: 'Email', uid: 'email' },
        { kind: 'action', type: 'button', label: 'Submit', uid: 'submit', on: { click: 'submit' } },
      ],
    },
  },
};
</script>

<template>
  <GuiForm :config="config" @form-event="onEvent" />
</template>
```

See [golemui.com/integration/vue](https://golemui.com/integration/vue/) for the full guide.
