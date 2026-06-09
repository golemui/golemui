<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { NumberinputProps } from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/number';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<number>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  number,
  NumberinputProps
>(widget);

const handleInput = (e: Event) => onValueChanged((e as CustomEvent).detail.value);
const required = computed(() => (templateData.value.validator as Validator)?.required);
</script>

<template>
  <div class="gui-number gui-field" :style="{ flex: templateData.size }">
    <gui-number
      :uid="uid"
      :label="templateData.label"
      :hint="templateData.hint"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value="value"
      :step="templateData.step"
      :minimum="templateData.minimum"
      :maximum="templateData.maximum"
      :autoGrow="templateData.autoGrow"
      :autocomplete="templateData.autocomplete ?? undefined"
      :placeholder="templateData.placeholder ?? undefined"
      @input="handleInput"
      @blur="onBlur"
    ></gui-number>
  </div>
</template>
