<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { PasswordProps } from '@golemui/gui-shared';
import { computed } from 'vue';
import '@golemui/gui-components/password';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<string>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  string,
  PasswordProps
>(widget);

const handleInput = (e: Event) => onValueChanged((e as CustomEvent).detail.value);
const required = computed(() => (templateData.value.validator as Validator)?.required);
</script>

<template>
  <div class="gui-password gui-field" :style="{ flex: templateData.size }">
    <gui-password
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
      :showPasswordIcon="templateData.showPasswordIcon"
      :hidePasswordIcon="templateData.hidePasswordIcon"
      :showPasswordLabel="templateData.showPasswordLabel"
      :hidePasswordLabel="templateData.hidePasswordLabel"
      @input="handleInput"
      @blur="onBlur"
    ></gui-password>
  </div>
</template>
