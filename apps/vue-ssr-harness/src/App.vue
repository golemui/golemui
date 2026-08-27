<script setup lang="ts">
import type { FormSubmitEvent } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { GuiForm } from '@golemui/gui-vue';
import { formData, formDef } from './form-definition';

// An explicit formName keeps the form id identical on the server and the client,
// including on Vue versions before 3.5.
const config: GuiFormInitConfig = {
  formName: 'harness-form',
  formDef,
  data: formData,
};

const onFormSubmit = (event: FormSubmitEvent) => {
  console.log('form submitted', event.data);
};
</script>

<template>
  <div class="harness">
    <h1 class="harness__title">Vue server rendering harness</h1>
    <GuiForm :config="config" @form-submit="onFormSubmit" />
  </div>
</template>
