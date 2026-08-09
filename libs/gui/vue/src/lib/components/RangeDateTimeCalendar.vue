<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { DateTimeRange, RangeDateTimeCalendarProps } from '@golemui/gui-shared/internals';
import { computed, onUnmounted, ref, watch } from 'vue';
import '@golemui/gui-components/range-date-time-calendar';

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
} = useInputWidget<DateTimeRange[], RangeDateTimeCalendarProps>(widget);

const required = computed(() => (templateData.value.validator as Validator)?.required);

const dayFormat = computed(() => templateData.value.dayFormat || 'numeric');
const weekdayFormat = computed(() => templateData.value.weekdayFormat || 'narrow');
const monthFormat = computed(() => templateData.value.monthFormat || 'long');
const numberOfMonths = computed(() => templateData.value.numberOfMonths ?? 1);

const calendarRef = ref<HTMLElement | null>(null);
const changeHandler = (e: Event) => {
  injectValidationIssues(null);
  onValueChanged((e as CustomEvent).detail.value);
};
const errorHandler = (e: Event) => {
  injectValidationIssues([(e as CustomEvent).detail.message]);
  onBlur();
};

let currentEl: HTMLElement | null = null;
watch(calendarRef, (el) => {
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
  <div class="gui-range-date-time-calendar gui-field" :style="{ flex: templateData.size }">
    <gui-range-date-time-calendar
      ref="calendarRef"
      :uid="uid"
      :label="templateData.label"
      :hint="templateData.hint"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value.prop="value"
      :prevMonthIcon="templateData.prevMonthIcon"
      :nextMonthIcon="templateData.nextMonthIcon"
      :prevMonthAriaLabel="templateData.prevMonthAriaLabel"
      :nextMonthAriaLabel="templateData.nextMonthAriaLabel"
      :selectYearAriaLabel="templateData.selectYearAriaLabel"
      :yearGridAriaLabel="templateData.yearGridAriaLabel"
      :dayFormat.prop="dayFormat"
      :weekdayFormat.prop="weekdayFormat"
      :monthFormat.prop="monthFormat"
      :numberOfMonths.prop="numberOfMonths"
      :removePillAriaLabel="templateData.removePillAriaLabel"
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
      :incompleteMessage="templateData.incompleteMessage"
      :dayCountAriaLabel="templateData.dayCountAriaLabel"
      :disabledDayCountAriaLabel="templateData.disabledDayCountAriaLabel"
    />
  </div>
</template>
