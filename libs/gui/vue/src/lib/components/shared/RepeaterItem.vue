<script setup lang="ts">
import type { NonFunctionWidget } from '@golemui/core';
import { provide } from 'vue';
import { repeaterIndexesInjectionKey, WidgetRenderer } from '@golemui/vue';

const props = defineProps<{
  index: number;
  indexes: number[];
  title?: string;
  removeButtonIcon?: string;
  removeLabel?: string;
  template: NonFunctionWidget<string>;
}>();

defineEmits<{ (e: 'remove'): void }>();

provide(repeaterIndexesInjectionKey, props.indexes);
</script>

<template>
  <div class="gui-repeater__card">
    <div class="gui-repeater__card-header">
      <span v-if="title" class="gui-repeater__card-title">{{ title }} {{ index + 1 }}</span>
      <button
        type="button"
        tabindex="0"
        class="gui-button gui-button--sm gui-repeater__remove-btn"
        @click="$emit('remove')"
      >
        <span
          v-if="removeButtonIcon"
          :class="`gui-widget-icon gui-button-icon ${removeButtonIcon}`"
          :data-icon="removeButtonIcon"
        ></span>
        {{ removeLabel ?? 'Remove' }}
      </button>
    </div>
    <WidgetRenderer :widget="template" />
  </div>
</template>
