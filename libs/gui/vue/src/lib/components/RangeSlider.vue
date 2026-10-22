<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { RangeSliderProps, SliderRange } from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/range-slider';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<SliderRange>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  SliderRange,
  RangeSliderProps
>(widget);

const handleInput = (e: Event) => onValueChanged((e as CustomEvent).detail.value);
const required = computed(() => (templateData.value.validator as Validator)?.required);
</script>

<template>
  <div class="gui-range-slider gui-field">
    <!-- Vue writes 0 for an undefined number property: the bounds get their defaults here. -->
    <gui-range-slider
      :uid="uid"
      :label="templateData.label"
      :hint="templateData.hint"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value="value"
      :minimum="templateData.minimum ?? 0"
      :maximum="templateData.maximum ?? 100"
      :step="templateData.step ?? 1"
      :marks="templateData.marks"
      :format="templateData.format"
      :valuePlacement="templateData.valuePlacement"
      :startLabel="templateData.startLabel"
      :endLabel="templateData.endLabel"
      :localeId="templateData.lang"
      @gui-input="handleInput"
      @gui-blur="onBlur"
    ></gui-range-slider>
  </div>
</template>
