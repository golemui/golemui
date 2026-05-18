<script setup lang="ts">
import type { NonFunctionWidget } from '@golemui/core';
import { onErrorCaptured, ref } from 'vue';

defineProps<{
  widget: NonFunctionWidget<string>;
}>();

const error = ref<Error | null>(null);

onErrorCaptured((err) => {
  error.value = err as Error;
  console.error('Uncaught error:', err);
  return false;
});
</script>

<template>
  <div v-if="error" style="border: 1px solid red; padding: 4px">
    Component
    <code style="font-weight: bold">{{ widget.type }}[{{ widget.uid }}]</code>
    failed with:
    <p style="color: red; margin-top: 4px">
      <code>{{ error.message }}</code>
    </p>
  </div>
  <slot v-else />
</template>
