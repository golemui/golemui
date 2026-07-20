<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { TimeRange, RangeTimeInputProps } from '@golemui/gui-shared/internals';
import { computed, onUnmounted, ref, watch } from 'vue';
import '@golemui/gui-components/range-time-input';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<TimeRange[]>;
const {
  uid,
  errors,
  value,
  isTouched,
  templateData,
  onValueChanged,
  onBlur,
  injectValidationIssues,
} = useInputWidget<TimeRange[], RangeTimeInputProps>(widget);

const required = computed(() => (templateData.value.validator as Validator)?.required);

const elRef = ref<HTMLElement | null>(null);
const changeHandler = (e: Event) => {
  injectValidationIssues(null);
  onValueChanged((e as CustomEvent).detail.value);
};
const blurHandler = () => onBlur();
const errorHandler = (e: Event) => {
  injectValidationIssues([(e as CustomEvent).detail.message]);
};

let currentEl: HTMLElement | null = null;
watch(elRef, (el) => {
  if (currentEl) {
    currentEl.removeEventListener('blur', blurHandler);
    currentEl.removeEventListener('change', changeHandler);
    currentEl.removeEventListener('inputError', errorHandler);
  }
  currentEl = el;
  if (el) {
    el.addEventListener('blur', blurHandler);
    el.addEventListener('change', changeHandler);
    el.addEventListener('inputError', errorHandler);
  }
});

onUnmounted(() => {
  currentEl?.removeEventListener('blur', blurHandler);
  currentEl?.removeEventListener('change', changeHandler);
  currentEl?.removeEventListener('inputError', errorHandler);
});
</script>

<template>
  <div class="gui-range-time-input gui-field" :style="{ flex: templateData.size }">
    <gui-range-time
      ref="elRef"
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
      :separator="templateData.separator"
      :removePillAriaLabel="templateData.removePillAriaLabel"
      :startTimeAriaLabel="templateData.startTimeAriaLabel"
      :endTimeAriaLabel="templateData.endTimeAriaLabel"
      :hourFormat="templateData.hourFormat"
      :minuteStep="templateData.minuteStep"
      :minTime="templateData.minTime"
      :maxTime="templateData.maxTime"
      :minTimeMessage="templateData.minTimeMessage"
      :maxTimeMessage="templateData.maxTimeMessage"
      :rangeOrderMessage="templateData.rangeOrderMessage"
    />
  </div>
</template>
