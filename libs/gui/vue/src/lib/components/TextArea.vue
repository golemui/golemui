<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { TextareaProps } from '@golemui/gui-shared';
import { computed } from 'vue';
import '@golemui/gui-components/textarea';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<string>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  string,
  TextareaProps
>(widget);

const handleInput = (e: Event) => onValueChanged((e as CustomEvent).detail.value);
const required = computed(() => (templateData.value.validator as Validator)?.required);
const maxLength = computed(() => (templateData.value.validator as Validator)?.maxLength);
// Mirror Lit element's internal `?? 'remaining'` / `?? 120` fallbacks so an
// empty string from Vue→Lit attribute coercion can't slip past the `??` operator.
const counterMode = computed(() => templateData.value.counterMode || 'remaining');
const minimumHeight = computed(() => templateData.value.minimumHeight ?? 120);
</script>

<template>
  <div class="gui-textarea gui-field" :style="{ flex: templateData.size }">
    <gui-textarea
      :uid="uid"
      :label="templateData.label"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value="value"
      :hint="templateData.hint"
      :placeholder="templateData.placeholder"
      :autocomplete="templateData.autocomplete ?? undefined"
      :counterMode.prop="counterMode"
      :minimumHeight.prop="minimumHeight"
      :autoGrow="templateData.autoGrow"
      :maxLength="maxLength"
      @input="handleInput"
      @blur="onBlur"
    ></gui-textarea>
  </div>
</template>
