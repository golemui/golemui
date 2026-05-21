<script setup lang="ts">
import { modularDx, onFormEvent } from '@golemui/apps-shared';
import { GuiForm } from '@golemui/gui-vue';
import type { GuiFormInitConfig } from '@golemui/gui-shared';

const md = modularDx;
const config: GuiFormInitConfig = {
  formDef: md.formDef,
  data: md.data,
  formSelectors: md.formSelectors,
  formConfig: md.formConfig,
};
</script>

<template>
  <div>
    <GuiForm :config="config" @form-event="onFormEvent" />
  </div>
</template>
