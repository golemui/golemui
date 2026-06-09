<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { CurrencyProps } from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/currency';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<number>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  number,
  CurrencyProps
>(widget);

const handleInput = (e: Event) => onValueChanged((e as CustomEvent).detail.value);
const required = computed(() => (templateData.value.validator as Validator)?.required);
</script>

<template>
  <div class="gui-currency gui-field" :style="{ flex: templateData.size }">
    <gui-currency
      :uid="uid"
      :label="templateData.label"
      :hint="templateData.hint"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value="value"
      :currency="templateData.currency"
      :step="templateData.step"
      :maximumFractionDigits="templateData.maximumFractionDigits"
      :minimumFractionDigits="templateData.minimumFractionDigits"
      :icon="templateData.icon"
      :autocomplete="templateData.autocomplete ?? undefined"
      :placeholder="templateData.placeholder ?? undefined"
      :localeId="templateData.lang"
      @input="handleInput"
      @blur="onBlur"
    ></gui-currency>
  </div>
</template>
