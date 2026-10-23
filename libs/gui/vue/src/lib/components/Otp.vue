<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { OtpProps } from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/otp';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<string>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  string,
  OtpProps
>(widget);

const handleInput = (e: Event) => onValueChanged((e as CustomEvent).detail.value);
const required = computed(() => (templateData.value.validator as Validator)?.required);
// The code is as long as the validator's exactLength, which makes a partial code invalid. Vue would
// write 0 for an undefined number, so the element's default goes here.
const length = computed(() => (templateData.value.validator as Validator)?.exactLength ?? 6);
</script>

<template>
  <div class="gui-otp gui-field">
    <gui-otp
      :uid="uid"
      :label="templateData.label"
      :hint="templateData.hint"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value="value"
      :length="length"
      :groups="templateData.groups"
      @gui-input="handleInput"
      @gui-blur="onBlur"
    ></gui-otp>
  </div>
</template>
