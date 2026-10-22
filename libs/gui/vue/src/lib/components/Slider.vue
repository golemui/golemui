<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { SliderProps } from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/slider';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<number>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  number,
  SliderProps
>(widget);

const handleInput = (e: Event) => onValueChanged((e as CustomEvent).detail.value);
const required = computed(() => (templateData.value.validator as Validator)?.required);
// Vue writes 0 into a custom element property that currently holds a number when the bound
// value is undefined. gui-slider reads NaN as "no value", and the bounds get their defaults here.
const elementValue = computed(() => value.value ?? Number.NaN);
</script>

<template>
  <div class="gui-slider gui-field">
    <gui-slider
      :uid="uid"
      :label="templateData.label"
      :hint="templateData.hint"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value="elementValue"
      :minimum="templateData.minimum ?? 0"
      :maximum="templateData.maximum ?? 100"
      :step="templateData.step ?? 1"
      :marks="templateData.marks"
      :format="templateData.format"
      :valuePlacement="templateData.valuePlacement"
      :localeId="templateData.lang"
      @gui-input="handleInput"
      @gui-blur="onBlur"
    ></gui-slider>
  </div>
</template>
