<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import type { NumberValidator } from '@golemui/gui-validators';
import { useInputWidget } from '@golemui/vue';
import type { RatingProps } from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/rating';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<number>;
const { uid, formName, errors, value, isTouched, templateData, onValueChanged, onBlur } =
  useInputWidget<number, RatingProps>(widget);

const handleChange = (e: Event) => onValueChanged((e as CustomEvent).detail.value);
const required = computed(() => (templateData.value.validator as Validator)?.required);
// Vue writes 0 into a number property whose value is undefined: gui-rating reads NaN as "no
// value", and its number of stars, the integer validator's maximum, gets its default here.
const elementValue = computed(() => value.value ?? Number.NaN);
const max = computed(() => (templateData.value.validator as NumberValidator)?.maximum ?? 5);
</script>

<template>
  <div class="gui-rating gui-field">
    <gui-rating
      :uid="uid"
      :id-prefix="formName"
      :label="templateData.label"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value="elementValue"
      :hint="templateData.hint"
      :max="max"
      @gui-input="handleChange"
      @gui-blur="onBlur"
    ></gui-rating>
  </div>
</template>
