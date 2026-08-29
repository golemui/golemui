<script setup lang="ts">
import {
  allowedNames,
  commonLanguages,
  initializeI18n,
  kitchenSink,
  mockUploadService,
  onFormEvent,
} from '@golemui/apps-shared';
import {
  type FormEvent,
  type FormHealth,
  type FormSubmitEvent,
  type ValidateOn,
  devToolsMiddleware,
} from '@golemui/core';
import { GuiForm } from '@golemui/gui-vue';
import type { Dependencies, GuiFormInitConfig } from '@golemui/gui-shared';
import type { CustomValidatorSchemas } from '@golemui/gui-validators';
import type { VueItemRenderer } from '@golemui/vue';
import i18next from 'i18next';
import snarkdown from 'snarkdown';
import CustomFormHealthBoundary from '~/components/CustomFormHealthBoundary.vue';
import AirportItemRenderer from '~/components/item-renderers/AirportItemRenderer.vue';
import ComplexListItemRenderer from '~/components/item-renderers/ComplexListItemRenderer.vue';
import CountryItemRenderer from '~/components/item-renderers/CountryItemRenderer.vue';
import ProductItemRenderer from '~/components/item-renderers/ProductItemRenderer.vue';
import { customWidgetLoaders } from '~/utils/custom-widget-loaders';

const mock = kitchenSink;
const formData = mock.data;
const formMeta = mock.meta;
// i18next is a module level singleton. On the server every request re-initializes it with the
// same resources, which is fine for a playground; an app would scope the translator per request.
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
  uploadService: mockUploadService,
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
function formSubmitHandler(event: FormSubmitEvent) {
  console.log('👉 onFormSubmit', event.data);
}

const config: GuiFormInitConfig = {
  // An explicit name keeps the form id identical on the server and the client.
  formName: 'json-kitchen-sink',
  formDef: mock.form,
  data: formData,
  meta: formMeta,
  customValidators,
  middlewares,
  itemRenderers,
  localization,
  dependencies: deps,
  functions: mock.functions,
  customWidgetLoaders,
  validateOn,
};

const onFormHealth = (formHealth: FormHealth) => {
  if (formHealth.status === 'errored') {
    console.log('GolemUI form health error:', formHealth.message);
  }
};

const onLanguageChanged = (event: Event) => {
  const code = (event as CustomEvent<{ value: string }>).detail.value;
  i18next.changeLanguage(code);
};
</script>

<template>
  <div>
    <div v-if="languages.length > 0">
      <!-- `.prop` keeps the options off the server markup; an attribute would stringify them. -->
      <gui-select
        label="Language picker"
        uid="language"
        value="en"
        :options.prop="languages"
        @change="onLanguageChanged"
      ></gui-select>
    </div>
    <GuiForm
      :config="config"
      autocomplete="off"
      :form-health-boundary="CustomFormHealthBoundary"
      @form-health="onFormHealth"
      @form-event="formEventHandler"
      @form-submit="formSubmitHandler"
    />
  </div>
</template>
