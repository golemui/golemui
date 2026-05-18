<script setup lang="ts">
import {
  allowedNames,
  commonLanguages,
  initializeI18n,
  kitchenSink,
  onFormEvent,
} from '@golemui/apps-shared';
import {
  type Form,
  type FormEvent,
  type FormHealth,
  type ValidateOn,
  devToolsMiddleware,
} from '@golemui/core';
import { GuiForm } from '@golemui/gui-vue';
import type { Dependencies, GuiFormInitConfig } from '@golemui/gui-shared';
import type { CustomValidatorSchemas } from '@golemui/gui-validators';
import type { VueItemRenderer } from '@golemui/vue';
import i18next from 'i18next';
import { computed, onMounted, ref } from 'vue';
import snarkdown from 'snarkdown';
import AirportItemRenderer from '../../item-renderers/AirportItemRenderer.vue';
import ComplexListItemRenderer from '../../item-renderers/ComplexListItemRenderer.vue';
import CountryItemRenderer from '../../item-renderers/CountryItemRenderer.vue';
import ProductItemRenderer from '../../item-renderers/ProductItemRenderer.vue';

const mock = kitchenSink;
const formData = mock.data;
const formMeta = mock.meta;
const localization = initializeI18n(mock.resources);
const languages = commonLanguages
  .filter(({ code }) => Object.keys(mock.resources).includes(code))
  .map(({ code, label, flag }) => ({
    value: code,
    label: `${flag} ${label}`,
  }));
const deps: Dependencies = {
  markdown: {
    parse: (md: string) => snarkdown(md),
  },
};
const customWidgetLoaders = {
  heading: async () => (await import('../../custom-fields/heading/HeadingComponent.vue')).default,
};
const middlewares = [devToolsMiddleware()];
const customValidators: CustomValidatorSchemas = {
  allowedNames,
};
const itemRenderers: Record<string, VueItemRenderer<any>> = {
  complexListItemRenderer: ComplexListItemRenderer,
  productItemRenderer: ProductItemRenderer,
  airportItemRenderer: AirportItemRenderer,
  countryItemRenderer: CountryItemRenderer,
};
const validateOn: ValidateOn = 'eager';
function formEventHandler(event: FormEvent) {
  if (mock.onFormEvent) mock.onFormEvent(event);
  onFormEvent(event);
}

const error = ref('');
const formDef = ref<Form<string> | undefined>(undefined);

onMounted(async () => {
  const form = mock.form;
  if (typeof form === 'function') {
    formDef.value = await form();
  } else {
    formDef.value = form;
  }
});

const config = computed<GuiFormInitConfig | undefined>(() =>
  formDef.value
    ? {
        formDef: formDef.value,
        data: formData,
        meta: formMeta,
        customValidators,
        middlewares,
        itemRenderers,
        localization,
        dependencies: deps,
        customWidgetLoaders,
        validateOn,
      }
    : undefined,
);

const onFormHealth = (formHealth: FormHealth) => {
  if (formHealth.status === 'errored') error.value = formHealth.message;
};

const onLanguageChanged = (event: Event) => {
  const code = (event as CustomEvent<{ value: string }>).detail.value;
  i18next.changeLanguage(code);
};
</script>

<template>
  <div>
    <div v-if="languages.length > 0">
      <gui-select
        label="Language picker"
        uid="language"
        value="en"
        :options="languages"
        @change="onLanguageChanged"
      ></gui-select>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <GuiForm
      v-if="config"
      :config="config"
      autocomplete="off"
      @form-health="onFormHealth"
      @form-event="formEventHandler"
    />
  </div>
</template>

<style scoped>
.error {
  color: var(--gui-intent-danger, #dc2626);
  font-weight: 600;
}
</style>
