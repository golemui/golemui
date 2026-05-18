<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { OptionValue, SelectProps } from '@golemui/gui-shared';
import { computed, onUnmounted, ref, watch } from 'vue';
import '@golemui/gui-components/select';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<string>;
const {
  uid,
  errors,
  value,
  isTouched,
  templateData,
  onValueChanged,
  onBlur,
  injectValidationIssues,
} = useInputWidget<OptionValue, SelectProps>(widget);

const handleChange = (e: Event) => onValueChanged((e as CustomEvent).detail.value);
const required = computed(() => (templateData.value.validator as Validator)?.required);

const selectRef = ref<HTMLElement | null>(null);
let currentEl: HTMLElement | null = null;

const errorHandler = (e: Event) => {
  injectValidationIssues([(e as CustomEvent).detail.message]);
};

watch(selectRef, (el) => {
  if (currentEl) currentEl.removeEventListener('inputError', errorHandler);
  currentEl = el;
  if (el) el.addEventListener('inputError', errorHandler);
});

onUnmounted(() => {
  currentEl?.removeEventListener('inputError', errorHandler);
});
</script>

<template>
  <div class="gui-select gui-field" :style="{ flex: templateData.size }">
    <gui-select
      ref="selectRef"
      :uid="uid"
      :label="templateData.label"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value="value"
      :hint="templateData.hint"
      :placeholder="templateData.placeholder"
      :autocomplete="templateData.autocomplete ?? undefined"
      :icon="templateData.icon"
      :options="templateData.options"
      :labelField="templateData.labelField"
      :valueField="templateData.valueField"
      @change="handleChange"
      @blur="onBlur"
    ></gui-select>
  </div>
</template>
