<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { CalendarProps } from '@golemui/gui-shared';
import { computed, onUnmounted, ref, watch } from 'vue';
import '@golemui/gui-components/calendar';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<string>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  string,
  CalendarProps
>(widget);

const required = computed(() => (templateData.value.validator as Validator)?.required);

// Default to the same values as the Lit element's class-field initializers so
// we never pass undefined or '' (which Intl.DateTimeFormat rejects with a RangeError).
const dayFormat = computed(() => templateData.value.dayFormat || 'numeric');
const weekdayFormat = computed(() => templateData.value.weekdayFormat || 'narrow');
const monthFormat = computed(() => templateData.value.monthFormat || 'long');
const numberOfMonths = computed(() => templateData.value.numberOfMonths ?? 1);

const calRef = ref<HTMLElement | null>(null);
const changeHandler = (e: Event) => onValueChanged((e as CustomEvent).detail.value);
const blurHandler = () => onBlur();

let currentEl: HTMLElement | null = null;
watch(calRef, (el) => {
  if (currentEl) {
    currentEl.removeEventListener('blur', blurHandler);
    currentEl.removeEventListener('change', changeHandler);
  }
  currentEl = el;
  if (el) {
    el.addEventListener('blur', blurHandler);
    el.addEventListener('change', changeHandler);
  }
});

onUnmounted(() => {
  currentEl?.removeEventListener('blur', blurHandler);
  currentEl?.removeEventListener('change', changeHandler);
});
</script>

<template>
  <div class="gui-calendar gui-field" :style="{ flex: templateData.size }">
    <gui-calendar
      ref="calRef"
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
      :numberOfMonths.prop="numberOfMonths"
      :localeId="templateData.lang"
    />
  </div>
</template>
