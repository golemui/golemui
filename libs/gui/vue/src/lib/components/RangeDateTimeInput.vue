<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { DateTimeRange, RangeDateTimeInputProps } from '@golemui/gui-shared/internals';
import { computed, onUnmounted, ref, watch } from 'vue';
import '@golemui/gui-components/range-date-time-input';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<DateTimeRange[]>;
const {
  uid,
  errors,
  value,
  isTouched,
  templateData,
  onValueChanged,
  onBlur,
  injectValidationIssues,
} = useInputWidget<DateTimeRange[], RangeDateTimeInputProps>(widget);

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
  <div class="gui-range-date-time-input gui-field" :style="{ flex: templateData.size }">
    <gui-range-date-time
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
      :dayAriaLabel="templateData.dayAriaLabel"
      :monthAriaLabel="templateData.monthAriaLabel"
      :yearAriaLabel="templateData.yearAriaLabel"
      :hourAriaLabel="templateData.hourAriaLabel"
      :minuteAriaLabel="templateData.minuteAriaLabel"
      :dayPeriodAriaLabel="templateData.dayPeriodAriaLabel"
      :separator="templateData.separator"
      :removePillAriaLabel="templateData.removePillAriaLabel"
      :startDateTimeAriaLabel="templateData.startDateTimeAriaLabel"
      :endDateTimeAriaLabel="templateData.endDateTimeAriaLabel"
      :hourFormat="templateData.hourFormat"
      :minuteStep="templateData.minuteStep"
      :minDateTime="templateData.minDateTime"
      :maxDateTime="templateData.maxDateTime"
      :invalidDateMessage="templateData.invalidDateMessage"
      :minDateTimeMessage="templateData.minDateTimeMessage"
      :maxDateTimeMessage="templateData.maxDateTimeMessage"
      :incompleteMessage="templateData.incompleteMessage"
    />
  </div>
</template>
