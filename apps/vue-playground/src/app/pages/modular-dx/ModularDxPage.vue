<script setup lang="ts">
import { mockUploadService, modularDx, onFormEvent } from '@golemui/apps-shared';
import type { FormHealth, FormSubmitEvent } from '@golemui/core';
import { GuiForm } from '@golemui/gui-vue';
import type { Dependencies, GuiFormInitConfig } from '@golemui/gui-shared';
import { ref } from 'vue';
import snarkdown from 'snarkdown';

const md = modularDx;
const dependencies: Dependencies = {
  markdown: { parse: (markdown: string) => snarkdown(markdown) },
  uploadService: mockUploadService,
};
const config: GuiFormInitConfig = {
  formDef: md.formDef,
  data: md.data,
  formSelectors: md.formSelectors,
  formConfig: md.formConfig,
  dependencies,
};

const errors = ref<string[]>([]);

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
      @form-event="onFormEvent"
      @form-health="onFormHealth"
      @form-submit="onFormSubmit"
    />
  </div>
</template>
