<script setup lang="ts">
import { buildKitchenSinkDx, initializeI18n, onFormEvent } from '@golemui/apps-shared';
import type { FormHealth } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { GuiForm } from '@golemui/gui-vue';
import snarkdown from 'snarkdown';
import { h, ref } from 'vue';
import AirportItemRenderer from '../../item-renderers/AirportItemRenderer.vue';
import ComplexListItemRenderer from '../../item-renderers/ComplexListItemRenderer.vue';
import CountryItemRenderer from '../../item-renderers/CountryItemRenderer.vue';
import ProductItemRenderer from '../../item-renderers/ProductItemRenderer.vue';

const localization = initializeI18n({});

const ks = buildKitchenSinkDx({
  widgetLoaders: {
    heading: async () => (await import('../../custom-fields/heading/HeadingComponent.vue')).default,
  },
  itemRenderers: {
    complexListItemRenderer: ComplexListItemRenderer,
    productItemRenderer: ProductItemRenderer,
    airportItemRenderer: AirportItemRenderer,
    countryItemRenderer: CountryItemRenderer,
  },
  dependencies: {
    markdown: {
      parse: (md: string) => snarkdown(md),
    },
  },
  // Vue-flavored Renderer example — the `render` function is called with the
  // form API and returns a VNode produced by Vue's `h()`.
  rendererExample: (api: any) =>
    h('h1', `Client name: ${api?.$form?.rendererClientName || 'unknown'}`),
});

const config: GuiFormInitConfig = {
  formDef: ks.formDef,
  data: ks.data,
  formSelectors: ks.formSelectors,
  formConfig: ks.formConfig,
  customValidators: ks.customValidators,
  localization,
};

const errors = ref<string[]>([]);

function onFormHealth(event: FormHealth) {
  if (event.status === 'errored') {
    errors.value = [...errors.value, event.message];
  }
}
</script>

<template>
  <div>
    <div
      v-if="errors.length"
      style="border: 2px solid red; padding: 8px 12px; margin-bottom: 12px; color: red"
    >
      <ul style="margin: 0; padding-left: 20px">
        <li v-for="(error, i) in errors" :key="i">{{ error }}</li>
      </ul>
    </div>
    <GuiForm :config="config" @form-event="onFormEvent" @form-health="onFormHealth" />
  </div>
</template>
