<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { DateTimeInputProps } from '@golemui/gui-shared/internals';
import { computed, onUnmounted, ref, watch } from 'vue';
import '@golemui/gui-components/date-time-input';

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
} = useInputWidget<string, DateTimeInputProps>(widget);

const required = computed(() => (templateData.value.validator as Validator)?.required);

const dateTimeRef = ref<HTMLElement | null>(null);
const changeHandler = (e: Event) => {
  injectValidationIssues(null);
  onValueChanged((e as CustomEvent).detail.value);
};
const errorHandler = (e: Event) => {
  injectValidationIssues([(e as CustomEvent).detail.message]);
};

let currentEl: HTMLElement | null = null;
watch(dateTimeRef, (el) => {
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
  <div class="gui-date-time gui-field" :style="{ flex: templateData.size }">
    <gui-date-time
      ref="dateTimeRef"
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
      :hourFormat="templateData.hourFormat"
      :minuteStep="templateData.minuteStep ?? 1"
    />
  </div>
</template>
