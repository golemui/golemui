<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { DateRange, RangeCalendarProps } from '@golemui/gui-shared/internals';
import { computed, onUnmounted, ref, watch } from 'vue';
import '@golemui/gui-components/range-calendar';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<DateRange[]>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur, injectValidationIssues } =
  useInputWidget<DateRange[], RangeCalendarProps>(widget);

const required = computed(() => (templateData.value.validator as Validator)?.required);

// Default to the same values as the Lit element's class-field initializers so
// we never pass undefined or '' (which Intl.DateTimeFormat rejects with a RangeError).
const dayFormat = computed(() => templateData.value.dayFormat || 'numeric');
const weekdayFormat = computed(() => templateData.value.weekdayFormat || 'narrow');
const monthFormat = computed(() => templateData.value.monthFormat || 'long');
const numberOfMonths = computed(() => templateData.value.numberOfMonths ?? 1);

const elRef = ref<HTMLElement | null>(null);
const changeHandler = (e: Event) => {
  injectValidationIssues(null);
  onValueChanged((e as CustomEvent).detail.value);
};
const blurHandler = () => onBlur();
const errorHandler = (e: Event) => {
  injectValidationIssues([(e as CustomEvent).detail.message]);
  onBlur();
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
  <div class="gui-range-calendar gui-field" :style="{ flex: templateData.size }">
    <gui-range-calendar
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
      :prevMonthIcon="templateData.prevMonthIcon"
      :nextMonthIcon="templateData.nextMonthIcon"
      :prevMonthAriaLabel="templateData.prevMonthAriaLabel"
      :nextMonthAriaLabel="templateData.nextMonthAriaLabel"
      :dayFormat.prop="dayFormat"
      :weekdayFormat.prop="weekdayFormat"
      :monthFormat.prop="monthFormat"
      :minDate="templateData.minDate"
      :maxDate="templateData.maxDate"
      :disabledRanges="templateData.disabledRanges"
      :disabledDateRangeMessage="templateData.disabledDateRangeMessage"
      :numberOfMonths.prop="numberOfMonths"
      :hidePills="false"
      :removePillAriaLabel="templateData.removePillAriaLabel"
      :localeId="templateData.lang"
    />
  </div>
</template>
