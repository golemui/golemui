<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { CheckboxProps } from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/checkbox';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<boolean>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  boolean,
  CheckboxProps
>(widget);

const handleChange = (e: Event) => onValueChanged((e as CustomEvent).detail.value);
const required = computed(() => (templateData.value.validator as Validator)?.required);
// Mirror Lit class-field default to avoid Vue coercing undefined → '' on the enum prop.
const checkboxPosition = computed(() => templateData.value.checkboxPosition || 'left');
</script>

<template>
  <div class="gui-checkbox gui-field" :style="{ flex: templateData.size }">
    <gui-checkbox
      :uid="uid"
      :label="templateData.label"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value="value"
      :hint="templateData.hint"
      :checkboxPosition.prop="checkboxPosition"
      @change="handleChange"
      @blur="onBlur"
    ></gui-checkbox>
  </div>
</template>
