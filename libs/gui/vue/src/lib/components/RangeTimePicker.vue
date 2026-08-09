<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { TimeRange, RangeTimePickerProps } from '@golemui/gui-shared/internals';
import { computed, onUnmounted, ref, watch } from 'vue';
import '@golemui/gui-components/range-time-picker';

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
} = useInputWidget<TimeRange[], RangeTimePickerProps>(widget);

const required = computed(() => (templateData.value.validator as Validator)?.required);

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
  <div class="gui-range-time-picker gui-field" :style="{ flex: templateData.size }">
    <gui-range-time-picker
      ref="pickerRef"
      :uid="uid"
      :label="templateData.label"
      :hint="templateData.hint"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value.prop="value"
      :icon="templateData.icon"
      :localeId="templateData.lang"
      :toggleAriaLabel="templateData.toggleAriaLabel"
      :hourAriaLabel="templateData.hourAriaLabel"
      :minuteAriaLabel="templateData.minuteAriaLabel"
      :dayPeriodAriaLabel="templateData.dayPeriodAriaLabel"
      :separator="templateData.separator"
      :removePillAriaLabel="templateData.removePillAriaLabel"
      :startTimeAriaLabel="templateData.startTimeAriaLabel"
      :endTimeAriaLabel="templateData.endTimeAriaLabel"
      :startTimeLabel="templateData.startTimeLabel"
      :endTimeLabel="templateData.endTimeLabel"
      :hourFormat="templateData.hourFormat"
      :minuteStep="templateData.minuteStep"
      :minTime="templateData.minTime"
      :maxTime="templateData.maxTime"
      :disabledRanges.prop="templateData.disabledRanges"
      :allowCustomTime="templateData.allowCustomTime"
      :height="templateData.height"
      :itemHeight="templateData.itemHeight"
      :minTimeMessage="templateData.minTimeMessage"
      :maxTimeMessage="templateData.maxTimeMessage"
      :rangeOrderMessage="templateData.rangeOrderMessage"
      :disabledRangeMessage="templateData.disabledRangeMessage"
      :noAvailableTimesMessage="templateData.noAvailableTimesMessage"
      :incompleteMessage="templateData.incompleteMessage"
    />
  </div>
</template>
