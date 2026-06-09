<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { ToggleProps } from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/toggle';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<boolean>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  boolean,
  ToggleProps
>(widget);

const handleChange = (e: Event) => onValueChanged((e as CustomEvent).detail.value);
const required = computed(() => (templateData.value.validator as Validator)?.required);
// Mirror Lit class-field default to avoid Vue coercing undefined → '' on the enum prop.
const togglePosition = computed(() => templateData.value.togglePosition || 'left');
</script>

<template>
  <div class="gui-toggle gui-field" :style="{ flex: templateData.size }">
    <gui-toggle
      :uid="uid"
      :label="templateData.label"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value="value"
      :hint="templateData.hint"
      :togglePosition.prop="togglePosition"
      @change="handleChange"
      @blur="onBlur"
    ></gui-toggle>
  </div>
</template>
