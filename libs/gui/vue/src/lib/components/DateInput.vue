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
    currentEl.removeEventListener('gui-input', changeHandler);
    currentEl.removeEventListener('gui-blur', onBlur);
    currentEl.removeEventListener('gui-input-error', errorHandler);
  }
  currentEl = el;
  if (el) {
    el.addEventListener('gui-input', changeHandler);
    el.addEventListener('gui-blur', onBlur);
    el.addEventListener('gui-input-error', errorHandler);
  }
});

onUnmounted(() => {
  currentEl?.removeEventListener('gui-input', changeHandler);
  currentEl?.removeEventListener('gui-blur', onBlur);
  currentEl?.removeEventListener('gui-input-error', errorHandler);
});
</script>

<template>
  <div class="gui-date gui-field">
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
      :dayAriaLabel="templateData.dayAriaLabel"
      :monthAriaLabel="templateData.monthAriaLabel"
      :yearAriaLabel="templateData.yearAriaLabel"
      :invalidDateMessage="templateData.invalidDateMessage"
      :minDate="templateData.minDate"
      :maxDate="templateData.maxDate"
      :minDateMessage="templateData.minDateMessage"
      :maxDateMessage="templateData.maxDateMessage"
      :incompleteMessage="templateData.incompleteMessage"
    />
  </div>
</template>
