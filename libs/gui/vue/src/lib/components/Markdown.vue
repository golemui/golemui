<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget } from '@golemui/vue';
import type { MarkdownProps } from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/markdown';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<string>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  string,
  MarkdownProps
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
  <div class="gui-markdown gui-field" :style="{ flex: templateData.size }">
    <gui-markdown
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
      :tools="templateData.tools"
      :defaultOpenPreview="templateData.defaultOpenPreview"
      :headingTitle="templateData.headingTitle"
      :boldTitle="templateData.boldTitle"
      :italicTitle="templateData.italicTitle"
      :strikethroughTitle="templateData.strikethroughTitle"
      :quoteTitle="templateData.quoteTitle"
      :linkTitle="templateData.linkTitle"
      :orderedListTitle="templateData.orderedListTitle"
      :unorderedListTitle="templateData.unorderedListTitle"
      :splitViewTitle="templateData.splitViewTitle"
      :dependencies="templateData.deps"
      @input="handleInput"
      @blur="onBlur"
    ></gui-markdown>
  </div>
</template>
