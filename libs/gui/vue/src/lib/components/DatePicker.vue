<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { DatePickerProps } from '@golemui/gui-shared/internals';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import Errors from './shared/Errors.vue';
import '@golemui/gui-components/date-input';
import '@golemui/gui-components/calendar';

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
const showErrors = computed(() => isTouched.value && errors.value && errors.value.length > 0);

// Default to the same values as the Lit element's class-field initializers
const dayFormat = computed(() => templateData.value.dayFormat || 'numeric');
const weekdayFormat = computed(() => templateData.value.weekdayFormat || 'narrow');
const monthFormat = computed(() => templateData.value.monthFormat || 'long');
const numberOfMonths = computed(() => templateData.value.numberOfMonths ?? 1);

const isCalendarOpen = ref(false);
const containerRef = ref<HTMLDivElement | null>(null);
const dateControlRef = ref<HTMLElement | null>(null);
const calendarControlRef = ref<HTMLElement | null>(null);

const dateChange = (e: Event) => {
  injectValidationIssues(null);
  onValueChanged((e as CustomEvent).detail.value);
};
const dateFocus = () => {
  isCalendarOpen.value = true;
};
const dateError = (e: Event) => {
  injectValidationIssues([(e as CustomEvent).detail.message]);
};
let currentDate: HTMLElement | null = null;
watch(dateControlRef, (el) => {
  if (currentDate) {
    currentDate.removeEventListener('change', dateChange);
    currentDate.removeEventListener('focus', dateFocus);
    currentDate.removeEventListener('blur', onBlur);
    currentDate.removeEventListener('inputError', dateError);
  }
  currentDate = el;
  if (el) {
    el.addEventListener('change', dateChange);
    el.addEventListener('focus', dateFocus);
    el.addEventListener('blur', onBlur);
    el.addEventListener('inputError', dateError);
  }
});

const calChange = (e: Event) => {
  injectValidationIssues(null);
  onValueChanged((e as CustomEvent).detail.value);
  // Selecting a day in the calendar commits a single date, so close the
  // calendar afterwards. The range picker intentionally stays open so the user
  // can select multiple ranges and closes it themselves.
  isCalendarOpen.value = false;
};
const calBlur = () => {
  onBlur();
  isCalendarOpen.value = false;
};
let currentCal: HTMLElement | null = null;
watch(calendarControlRef, (el) => {
  if (currentCal) {
    currentCal.removeEventListener('blur', calBlur);
    currentCal.removeEventListener('change', calChange);
  }
  currentCal = el;
  if (el) {
    el.addEventListener('blur', calBlur);
    el.addEventListener('change', calChange);
  }
});

const onDocumentClick = (event: MouseEvent) => {
  if (!isCalendarOpen.value) return;
  const path = event.composedPath();
  const inDate = dateControlRef.value && path.includes(dateControlRef.value);
  const inCal = calendarControlRef.value && path.includes(calendarControlRef.value);
  if (!inDate && !inCal) isCalendarOpen.value = false;
};

onMounted(() => document.addEventListener('click', onDocumentClick));
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
  currentDate?.removeEventListener('change', dateChange);
  currentDate?.removeEventListener('focus', dateFocus);
  currentDate?.removeEventListener('blur', onBlur);
  currentDate?.removeEventListener('inputError', dateError);
  currentCal?.removeEventListener('blur', calBlur);
  currentCal?.removeEventListener('change', calChange);
});

const onFocusOut = (event: FocusEvent) => {
  if (!isCalendarOpen.value) return;
  const newFocus = event.relatedTarget as Node;
  if (newFocus && containerRef.value?.contains(newFocus)) return;
  isCalendarOpen.value = false;
};

const toggleCalendar = (event: MouseEvent) => {
  const target = event.target as HTMLElement;

  if (target.closest('.gui-calendar__day-button')) return;

  const isInputClick = target.closest('.gui-date-input__part');
  const isCalendarClick = target.closest('gui-calendar');
  if (isInputClick || isCalendarClick) {
    if (!isCalendarOpen.value) isCalendarOpen.value = true;
  } else {
    isCalendarOpen.value = !isCalendarOpen.value;
  }
};

const onKeyUp = (event: KeyboardEvent) => {
  if (event.target !== event.currentTarget) return;
  if (event.key === 'Enter' || event.key === ' ') {
    isCalendarOpen.value = !isCalendarOpen.value;
  }
};
</script>

<template>
  <div
    ref="containerRef"
    class="gui-date-picker gui-field"
    :style="{ flex: templateData.size }"
    @focusout="onFocusOut"
  >
    <label v-if="templateData.label" class="gui-label" :for="uid" :data-cy="`${uid}_label`">
      {{ templateData.label }}{{ required ? ' *' : '' }}
      <div v-if="templateData.hint" class="gui-widget-hint" :id="`${uid}_hint`">
        {{ templateData.hint }}
      </div>
    </label>
    <div
      role="button"
      tabindex="-1"
      class="gui-widget"
      :aria-expanded="isCalendarOpen"
      @click="toggleCalendar"
      @keyup="onKeyUp"
    >
      <gui-date
        ref="dateControlRef"
        :uid="uid"
        :hint="templateData.hint"
        :showErrors="false"
        :errors="errors"
        :touched="isTouched"
        :required="required"
        :disabled="templateData.disabled"
        :readOnly="templateData.readonly"
        :value="value"
        :icon="templateData.icon"
        :localeId="templateData.lang"
        :invalidDateMessage="templateData.invalidDateMessage"
      />
      <span class="gui-date-picker__arrow">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
          <path
            d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
          ></path>
        </svg>
      </span>
      <gui-calendar
        v-if="isCalendarOpen"
        ref="calendarControlRef"
        :uid="uid"
        :hint="templateData.hint"
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
    <Errors v-if="showErrors" :errors="errors" :uid="uid" />
  </div>
</template>
