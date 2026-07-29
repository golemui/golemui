<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { DateTimePickerProps } from '@golemui/gui-shared/internals';
import { computed, onUnmounted, ref, watch } from 'vue';
import '@golemui/gui-components/date-time-picker';

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
} = useInputWidget<string, DateTimePickerProps>(widget);

const required = computed(() => (templateData.value.validator as Validator)?.required);

const dayFormat = computed(() => templateData.value.dayFormat || 'numeric');
const weekdayFormat = computed(() => templateData.value.weekdayFormat || 'narrow');
const monthFormat = computed(() => templateData.value.monthFormat || 'long');
const numberOfMonths = computed(() => templateData.value.numberOfMonths ?? 1);

const pickerRef = ref<HTMLElement | null>(null);
const changeHandler = (e: Event) => {
  injectValidationIssues(null);
  onValueChanged((e as CustomEvent).detail.value);
};
const errorHandler = (e: Event) => {
  injectValidationIssues([(e as CustomEvent).detail.message]);
};

let currentEl: HTMLElement | null = null;
watch(pickerRef, (el) => {
  if (currentEl) {
    currentEl.removeEventListener('change', changeHandler);
    currentEl.removeEventListener('inputError', errorHandler);
    currentEl.removeEventListener('blur', onBlur);
  }
  currentEl = el;
  if (el) {
    el.addEventListener('change', changeHandler);
    el.addEventListener('inputError', errorHandler);
    el.addEventListener('blur', onBlur);
  }
});

onUnmounted(() => {
  currentEl?.removeEventListener('change', changeHandler);
  currentEl?.removeEventListener('inputError', errorHandler);
  currentEl?.removeEventListener('blur', onBlur);
});
</script>

<template>
  <div class="gui-date-time-picker gui-field" :style="{ flex: templateData.size }">
    <gui-date-time-picker
      ref="pickerRef"
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
      :toggleAriaLabel="templateData.toggleAriaLabel"
      :dayAriaLabel="templateData.dayAriaLabel"
      :monthAriaLabel="templateData.monthAriaLabel"
      :yearAriaLabel="templateData.yearAriaLabel"
      :hourAriaLabel="templateData.hourAriaLabel"
      :minuteAriaLabel="templateData.minuteAriaLabel"
      :dayPeriodAriaLabel="templateData.dayPeriodAriaLabel"
      :prevMonthIcon="templateData.prevMonthIcon"
      :nextMonthIcon="templateData.nextMonthIcon"
      :prevMonthAriaLabel="templateData.prevMonthAriaLabel"
      :nextMonthAriaLabel="templateData.nextMonthAriaLabel"
      :dayFormat.prop="dayFormat"
      :weekdayFormat.prop="weekdayFormat"
      :monthFormat.prop="monthFormat"
      :minDate="templateData.minDate"
      :maxDate="templateData.maxDate"
      :disabledRanges.prop="templateData.disabledRanges"
      :numberOfMonths.prop="numberOfMonths"
      :hourFormat="templateData.hourFormat"
      :minuteStep.prop="templateData.minuteStep"
      :minTime="templateData.minTime"
      :maxTime="templateData.maxTime"
      :disabledTimeRanges.prop="templateData.disabledTimeRanges"
      :allowCustomTime="templateData.allowCustomTime"
      :invalidDateMessage="templateData.invalidDateMessage"
      :minDateMessage="templateData.minDateMessage"
      :maxDateMessage="templateData.maxDateMessage"
      :disabledDateRangeMessage="templateData.disabledDateRangeMessage"
      :minTimeMessage="templateData.minTimeMessage"
      :maxTimeMessage="templateData.maxTimeMessage"
      :disabledTimeRangeMessage="templateData.disabledTimeRangeMessage"
      :noAvailableTimesMessage="templateData.noAvailableTimesMessage"
    />
  </div>
</template>
