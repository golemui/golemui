<script setup lang="ts">
import { modularDx, onFormEvent } from '@golemui/apps-shared';
import type { FormEvent, FormHealth, FormSubmitEvent } from '@golemui/core';
import { GuiForm } from '@golemui/gui-vue';
import type { Dependencies, GuiFormInitConfig } from '@golemui/gui-shared';
import { ref } from 'vue';
import snarkdown from 'snarkdown';

const md = modularDx;
const dependencies: Dependencies = {
  markdown: { parse: (markdown: string) => snarkdown(markdown) },
};
const config: GuiFormInitConfig = {
  formName: 'dx-modular',
  formDef: md.formDef,
  data: md.data,
  formSelectors: md.formSelectors,
  formConfig: md.formConfig,
  dependencies,
};

const errors = ref<string[]>([]);

const formEventHandler = (event: FormEvent) => {
  // `load` events fire during the server render; the shared handlers are browser-only.
  if (import.meta.server) return;
  onFormEvent(event);
};

const onFormSubmit = (event: FormSubmitEvent) => {
  console.log('👉 onFormSubmit', event.data);
};

const onFormHealth = (event: FormHealth) => {
  if (event.status === 'errored') {
    errors.value = [...errors.value, event.message];
  }
};
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
    <GuiForm
      :config="config"
      @form-event="formEventHandler"
      @form-health="onFormHealth"
      @form-submit="onFormSubmit"
    />
  </div>
</template>
