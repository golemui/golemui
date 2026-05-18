<script setup lang="ts">
import { buildKitchenSinkDx, initializeI18n, onFormEvent } from '@golemui/apps-shared';
import { GuiForm } from '@golemui/gui-vue';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import snarkdown from 'snarkdown';
import AirportItemRenderer from '../../item-renderers/AirportItemRenderer.vue';
import ComplexListItemRenderer from '../../item-renderers/ComplexListItemRenderer.vue';
import CountryItemRenderer from '../../item-renderers/CountryItemRenderer.vue';
import ProductItemRenderer from '../../item-renderers/ProductItemRenderer.vue';

const localization = initializeI18n({});

const ks = buildKitchenSinkDx({
  widgetLoaders: {
    heading: async () =>
      (await import('../../custom-fields/heading/HeadingComponent.vue')).default,
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
});

const config: GuiFormInitConfig = {
  formDef: ks.formDef,
  data: ks.data,
  formSelectors: ks.formSelectors,
  formConfig: ks.formConfig,
  customValidators: ks.customValidators,
  localization,
};
</script>

<template>
  <div>
    <GuiForm :config="config" @form-event="onFormEvent" />
  </div>
</template>
