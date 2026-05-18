<script setup lang="ts">
import { useInputWidget } from '@golemui/vue';
import type { InputWidget } from '@golemui/core';

const props = defineProps<{ widget: InputWidget<string, string> }>();

const { uid, value, errors, isTouched, templateData, onValueChanged, onBlur } =
  useInputWidget<string>(props.widget);

const showErrors = () => isTouched.value && errors.value.length > 0;
</script>

<template>
  <label class="textinput-demo" :for="uid">
    <span class="label">{{ (templateData as any).label ?? widget.path }}</span>
    <input
      :id="uid"
      type="text"
      :value="value ?? ''"
      @input="(e) => onValueChanged((e.target as HTMLInputElement).value)"
      @blur="onBlur"
    />
    <span v-if="showErrors()" class="errors">
      {{ errors.join(', ') }}
    </span>
  </label>
</template>

<style scoped>
.textinput-demo {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.label {
  font-size: 0.875rem;
  font-weight: 600;
}
input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font: inherit;
}
.errors {
  color: #dc2626;
  font-size: 0.8125rem;
}
</style>
