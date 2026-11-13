<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { CheckboxGroupProps, OptionValue } from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/checkbox-group';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<OptionValue[]>;
const { uid, formName, errors, value, isTouched, templateData, onValueChanged, onBlur } =
  useInputWidget<OptionValue[], CheckboxGroupProps>(widget);

const handleChange = (e: Event) => onValueChanged((e as CustomEvent).detail.value);
const required = computed(() => (templateData.value.validator as Validator)?.required);
// Mirror Lit class-field default to avoid Vue coercing undefined → '' on the enum prop.
const direction = computed(() => templateData.value.direction || 'column');
</script>

<template>
  <div class="gui-checkbox-group gui-field">
    <gui-checkbox-group
      :uid="uid"
      :id-prefix="formName"
      :label="templateData.label"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :values="value"
      :hint="templateData.hint"
      :options="templateData.options"
      :labelField="templateData.labelField"
      :valueField="templateData.valueField"
      :direction.prop="direction"
      @gui-input="handleChange"
      @gui-blur="onBlur"
    ></gui-checkbox-group>
  </div>
</template>
