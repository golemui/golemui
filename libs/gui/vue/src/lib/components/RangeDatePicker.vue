<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { DateRange, RangeDatePickerProps } from '@golemui/gui-shared/internals';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import Errors from './shared/Errors.vue';
import '@golemui/gui-components/range-date-input';
import '@golemui/gui-components/range-calendar';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<DateRange[]>;
const {
  uid,
  errors,
  value,
  isTouched,
  templateData,
  onValueChanged,
  onBlur,
  injectValidationIssues,
} = useInputWidget<DateRange[], RangeDatePickerProps>(widget);

const required = computed(() => (templateData.value.validator as Validator)?.required);
const showErrors = computed(() => isTouched.value && errors.value && errors.value.length > 0);

// Default to the same values as the Lit element's class-field initializers so
// we never pass undefined or '' (which Intl.DateTimeFormat rejects with a RangeError).
const dayFormat = computed(() => templateData.value.dayFormat || 'numeric');
const weekdayFormat = computed(() => templateData.value.weekdayFormat || 'narrow');
const monthFormat = computed(() => templateData.value.monthFormat || 'long');
const numberOfMonths = computed(() => templateData.value.numberOfMonths ?? 1);

const isCalendarOpen = ref(false);
const focusDate = ref<string | undefined>(undefined);
const containerRef = ref<HTMLDivElement | null>(null);
const dateControlRef = ref<HTMLElement | null>(null);
const calendarControlRef = ref<HTMLElement | null>(null);

const dateChange = (e: Event) => {
  injectValidationIssues(null);
  onValueChanged((e as CustomEvent).detail.value);
};
const dateFocus = () => {
  openCalendar();
};
const dateError = (e: Event) => {
  injectValidationIssues([(e as CustomEvent).detail.message]);
};
const datePillClick = (e: Event) => {
  focusDate.value = (e as CustomEvent).detail.range.start;
  openCalendar();
};
let currentDate: HTMLElement | null = null;
watch(dateControlRef, (el) => {
  if (currentDate) {
    currentDate.removeEventListener('change', dateChange);
    currentDate.removeEventListener('focus', dateFocus);
    currentDate.removeEventListener('blur', onBlur);
    currentDate.removeEventListener('inputError', dateError);
    currentDate.removeEventListener('pillClick', datePillClick);
  }
  currentDate = el;
  if (el) {
    el.addEventListener('change', dateChange);
    el.addEventListener('focus', dateFocus);
    el.addEventListener('blur', onBlur);
    el.addEventListener('inputError', dateError);
    el.addEventListener('pillClick', datePillClick);
  }
});

const calChange = (e: Event) => {
  injectValidationIssues(null);
  onValueChanged((e as CustomEvent).detail.value);
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
  currentDate?.removeEventListener('pillClick', datePillClick);
  currentCal?.removeEventListener('blur', calBlur);
  currentCal?.removeEventListener('change', calChange);
});

// Set by `openCalendar` when the dropdown was open and is being closed as
// part of opening the calendar. Removing the dropdown removes the focused
// pill from the DOM, triggering a focusout with `relatedTarget=null` —
// which would otherwise immediately close the calendar we just opened.
let ignoreNextFocusOut = false;

const onFocusOut = (event: FocusEvent) => {
  if (ignoreNextFocusOut) {
    ignoreNextFocusOut = false;
    return;
  }
  if (!isCalendarOpen.value) return;
  const newFocus = event.relatedTarget as Node;
  if (newFocus && containerRef.value?.contains(newFocus)) return;
  isCalendarOpen.value = false;
};

const closePillsDropdown = () => {
  const pills = containerRef.value?.querySelector('gui-pills') as
    | (HTMLElement & { closeDropdown?: () => void })
    | null;
  pills?.closeDropdown?.();
};

const openCalendar = () => {
  const dropdownWasOpen = !!containerRef.value?.querySelector('.gui-pills__dropdown');
  if (dropdownWasOpen) ignoreNextFocusOut = true;
  closePillsDropdown();
  isCalendarOpen.value = true;
};

const toggleCalendar = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const isInputClick = target.closest('.gui-range-date-input__part');
  const isCalendarClick = target.closest('gui-range-calendar');
  if (isInputClick || isCalendarClick) {
    if (!isCalendarOpen.value) openCalendar();
  } else if (isCalendarOpen.value) {
    isCalendarOpen.value = false;
  } else {
    openCalendar();
  }
};

// Dropdown (from the inner gui-pills compact bubble) and the calendar
// popover are mutually exclusive — opening one closes the other.
const onDropdownToggle = (event: Event) => {
  const detail = (event as CustomEvent<{ open: boolean }>).detail;
  if (detail?.open && isCalendarOpen.value) {
    isCalendarOpen.value = false;
  }
};

const onKeyUp = (event: KeyboardEvent) => {
  if (event.target !== event.currentTarget) return;
  if (event.key === 'Enter' || event.key === ' ') {
    if (isCalendarOpen.value) isCalendarOpen.value = false;
    else openCalendar();
  }
};
</script>

<template>
  <div
    ref="containerRef"
    class="gui-range-date-picker gui-field"
    :style="{ flex: templateData.size }"
    @focusout="onFocusOut"
    @dropdowntoggle="onDropdownToggle"
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
      <gui-range-date
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
        :separator="templateData.separator"
        :removePillAriaLabel="templateData.removePillAriaLabel"
        :startDateAriaLabel="templateData.startDateAriaLabel"
        :endDateAriaLabel="templateData.endDateAriaLabel"
        :invalidDateMessage="templateData.invalidDateMessage"
      />
      <span class="gui-range-date-picker__arrow">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
          <path
            d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
          ></path>
        </svg>
      </span>
      <gui-range-calendar
        v-if="isCalendarOpen"
        ref="calendarControlRef"
        :uid="uid"
        :hint="templateData.hint"
        :touched="isTouched"
        :required="required"
        :disabled="templateData.disabled"
        :readOnly="templateData.readonly"
        :value="value"
        :focusDate="focusDate"
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
        :hidePills="true"
      />
    </div>
    <Errors v-if="showErrors" :errors="errors" :uid="uid" />
  </div>
</template>
