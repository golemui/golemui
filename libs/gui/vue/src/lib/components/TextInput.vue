<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { TextinputProps } from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/textinput';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<string>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  string,
  TextinputProps
>(widget);

const handleInput = (e: Event) => onValueChanged((e as CustomEvent).detail.value);

const required = computed(() => (templateData.value.validator as Validator)?.required);
</script>

<template>
  <div class="gui-textinput gui-field" :style="{ flex: templateData.size }">
    <gui-textinput
      :uid="uid"
      :label="templateData.label"
      :hint="templateData.hint"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value="value"
      :icon="templateData.icon"
      :placeholder="templateData.placeholder ?? undefined"
      :autocomplete="templateData.autocomplete ?? undefined"
      @input="handleInput"
      @blur="onBlur"
    ></gui-textinput>
  </div>
</template>
