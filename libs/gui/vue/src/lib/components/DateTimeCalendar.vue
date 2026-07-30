<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { DateTimeCalendarProps } from '@golemui/gui-shared/internals';
import { computed, onUnmounted, ref, watch } from 'vue';
import '@golemui/gui-components/date-time-calendar';

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
} = useInputWidget<string, DateTimeCalendarProps>(widget);

const required = computed(() => (templateData.value.validator as Validator)?.required);

// Vue coerces absent props to falsy DOM values (undefined numbers become 0,
// undefined strings ''), which would break Intl formats and render 0 panels
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
  <div class="gui-date-time-calendar gui-field" :style="{ flex: templateData.size }">
    <gui-date-time-calendar
      ref="calendarRef"
      :uid="uid"
      :label="templateData.label"
      :hint="templateData.hint"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value="value"
      :prevMonthIcon="templateData.prevMonthIcon"
      :nextMonthIcon="templateData.nextMonthIcon"
      :prevMonthAriaLabel="templateData.prevMonthAriaLabel"
      :nextMonthAriaLabel="templateData.nextMonthAriaLabel"
      :selectYearAriaLabel="templateData.selectYearAriaLabel"
      :yearGridAriaLabel="templateData.yearGridAriaLabel"
      :dayFormat.prop="dayFormat"
      :weekdayFormat.prop="weekdayFormat"
      :monthFormat.prop="monthFormat"
      :minDate="templateData.minDate"
      :maxDate="templateData.maxDate"
      :disabledRanges.prop="templateData.disabledRanges"
      :numberOfMonths.prop="numberOfMonths"
      :localeId="templateData.lang"
      :hourFormat="templateData.hourFormat"
      :minuteStep="templateData.minuteStep"
      :minTime="templateData.minTime"
      :maxTime="templateData.maxTime"
      :disabledTimeRanges.prop="templateData.disabledTimeRanges"
      :allowCustomTime="templateData.allowCustomTime"
      :minTimeMessage="templateData.minTimeMessage"
      :maxTimeMessage="templateData.maxTimeMessage"
      :disabledTimeRangeMessage="templateData.disabledTimeRangeMessage"
      :noAvailableTimesMessage="templateData.noAvailableTimesMessage"
    />
  </div>
</template>
