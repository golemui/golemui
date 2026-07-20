<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { DateTimeRange, RangeDateTimePickerProps } from '@golemui/gui-shared/internals';
import { computed, onUnmounted, ref, watch } from 'vue';
import '@golemui/gui-components/range-date-time-picker';

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
} = useInputWidget<DateTimeRange[], RangeDateTimePickerProps>(widget);

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
  onBlur();
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
  <div class="gui-range-date-time-picker gui-field" :style="{ flex: templateData.size }">
    <gui-range-date-time-picker
      ref="pickerRef"
      :uid="uid"
      :label="templateData.label"
      :hint="templateData.hint"
      :icon="templateData.icon"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value.prop="value"
      :separator="templateData.separator"
      :removePillAriaLabel="templateData.removePillAriaLabel"
      :startDateTimeAriaLabel="templateData.startDateTimeAriaLabel"
      :endDateTimeAriaLabel="templateData.endDateTimeAriaLabel"
      :invalidDateMessage="templateData.invalidDateMessage"
      :prevMonthIcon="templateData.prevMonthIcon"
      :nextMonthIcon="templateData.nextMonthIcon"
      :prevMonthAriaLabel="templateData.prevMonthAriaLabel"
      :nextMonthAriaLabel="templateData.nextMonthAriaLabel"
      :dayFormat.prop="dayFormat"
      :weekdayFormat.prop="weekdayFormat"
      :monthFormat.prop="monthFormat"
      :numberOfMonths.prop="numberOfMonths"
      :localeId="templateData.lang"
      :hourFormat="templateData.hourFormat"
      :minuteStep="templateData.minuteStep"
      :allowCustomTime="templateData.allowCustomTime"
      :startTimeLabel="templateData.startTimeLabel"
      :endTimeLabel="templateData.endTimeLabel"
      :minDateTime="templateData.minDateTime"
      :maxDateTime="templateData.maxDateTime"
      :disabledRanges.prop="templateData.disabledRanges"
      :minDateTimeMessage="templateData.minDateTimeMessage"
      :maxDateTimeMessage="templateData.maxDateTimeMessage"
      :disabledRangeMessage="templateData.disabledRangeMessage"
      :noAvailableTimesMessage="templateData.noAvailableTimesMessage"
      :dayCountAriaLabel="templateData.dayCountAriaLabel"
      :disabledDayCountAriaLabel="templateData.disabledDayCountAriaLabel"
    />
  </div>
</template>
