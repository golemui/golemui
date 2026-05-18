<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { OptionValue, RadiogroupProps } from '@golemui/gui-shared';
import { computed } from 'vue';
import '@golemui/gui-components/radiogroup';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<string>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  OptionValue,
  RadiogroupProps
>(widget);

const handleChange = (e: Event) => onValueChanged((e as CustomEvent).detail.value);
const required = computed(() => (templateData.value.validator as Validator)?.required);
// Mirror Lit class-field default to avoid Vue coercing undefined → '' on the enum prop.
const direction = computed(() => templateData.value.direction || 'column');
</script>

<template>
  <div class="gui-radiogroup gui-field" :style="{ flex: templateData.size }">
    <gui-radiogroup
      :uid="uid"
      :label="templateData.label"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value="value"
      :hint="templateData.hint"
      :options="templateData.options"
      :labelField="templateData.labelField"
      :valueField="templateData.valueField"
      :direction.prop="direction"
      @change="handleChange"
      @blur="onBlur"
    ></gui-radiogroup>
  </div>
</template>
