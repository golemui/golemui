<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { TagsProps } from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/tags';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<string[]>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  string[],
  TagsProps
>(widget);

const handleChange = (e: Event) => onValueChanged((e as CustomEvent).detail.value as string[]);

const required = computed(() => (templateData.value.validator as Validator)?.required);
</script>

<template>
  <div class="gui-tags gui-field" :style="{ flex: templateData.size }">
    <gui-tags
      :uid="uid"
      :label="templateData.label"
      :hint="templateData.hint"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="templateData.disabled"
      :readOnly="templateData.readonly"
      :value="value"
      :placeholder="templateData.placeholder ?? undefined"
      :icon="templateData.icon"
      :separators="templateData.separators"
      :allowDuplicates="templateData.allowDuplicates ?? true"
      :trim="templateData.trim ?? true"
      :limit="templateData.limit"
      :removeAriaLabel="templateData.removeAriaLabel"
      :removeIcon="templateData.removeIcon"
      @change="handleChange"
      @blur="onBlur"
    ></gui-tags>
  </div>
</template>
