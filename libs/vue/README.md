# @golemui/vue

Vue 3 framework adapter for [GolemUI](https://golemui.com).

This package binds GolemUI's framework-agnostic form engine (`@golemui/core`) to Vue 3 via composables and a root `<FormComponent>` SFC. It does not ship any widgets — pair it with `@golemui/gui-vue` for the default widget set.

## Install

```bash
npm i @golemui/vue @golemui/core @golemui/gui-vue
```

## Vite configuration

GolemUI widgets are Lit custom elements under the hood (`<gui-textinput>`, `<gui-button>`, …). Tell the Vue compiler to leave them alone:

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
import { FormComponent } from '@golemui/vue';
import { widgetLoaders } from '@golemui/gui-vue';
import { gui } from '@golemui/gui-shared';

const config = {
  formDef: {
    form: {
      kind: 'layout',
      type: 'flex',
      children: [
        gui.inputs.textInput('email', { label: 'Email' }),
        gui.actions.button({ label: 'Submit', onClick: 'submit' }),
      ],
    },
  },
  widgetLoaders,
};
</script>

<template>
  <FormComponent :config="config" :validators="() => null" @form-event="onEvent" />
</template>
```

See [golemui.com/integration/vue](https://golemui.com/integration/vue/) for the full guide.
