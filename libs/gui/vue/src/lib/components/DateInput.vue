<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { DatePickerProps } from '@golemui/gui-shared/internals';
import { computed, onUnmounted, ref, watch } from 'vue';
import '@golemui/gui-components/date-input';

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
} = useInputWidget<string, DatePickerProps>(widget);

const required = computed(() => (templateData.value.validator as Validator)?.required);

const dateRef = ref<HTMLElement | null>(null);
const changeHandler = (e: Event) => {
  injectValidationIssues(null);
  onValueChanged((e as CustomEvent).detail.value);
};
const errorHandler = (e: Event) => {
  injectValidationIssues([(e as CustomEvent).detail.message]);
};

let currentEl: HTMLElement | null = null;
watch(dateRef, (el) => {
  if (currentEl) {
    currentEl.removeEventListener('change', changeHandler);
    currentEl.removeEventListener('blur', onBlur);
    currentEl.removeEventListener('inputError', errorHandler);
  }
  currentEl = el;
  if (el) {
    el.addEventListener('change', changeHandler);
    el.addEventListener('blur', onBlur);
    el.addEventListener('inputError', errorHandler);
  }
});

onUnmounted(() => {
  currentEl?.removeEventListener('change', changeHandler);
  currentEl?.removeEventListener('blur', onBlur);
  currentEl?.removeEventListener('inputError', errorHandler);
});
</script>

<template>
  <div class="gui-date gui-field" :style="{ flex: templateData.size }">
    <gui-date
      ref="dateRef"
      :uid="uid"
      :label="templateData.label"
      :hint="templateData.hint"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value="value"
      :icon="templateData.icon"
      :localeId="templateData.lang"
      :invalidDateMessage="templateData.invalidDateMessage"
      :minDate="templateData.minDate"
      :maxDate="templateData.maxDate"
      :minDateMessage="templateData.minDateMessage"
      :maxDateMessage="templateData.maxDateMessage"
    />
  </div>
</template>
