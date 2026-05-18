<script setup lang="ts">
import { useActionWidget } from '@golemui/vue';
import type { ActionWidget } from '@golemui/core';

const props = defineProps<{ widget: ActionWidget<string> }>();
const { templateData, onClick } = useActionWidget(props.widget);
</script>

<template>
  <button type="button" class="button-demo" @click="onClick">
    {{ (templateData as any).label ?? 'Submit' }}
  </button>
</template>

<style scoped>
.button-demo {
  align-self: flex-start;
  padding: 0.5rem 1rem;
  border: 0;
  border-radius: 4px;
  background: #2563eb;
  color: white;
  font: inherit;
  cursor: pointer;
}
.button-demo:hover {
  background: #1d4ed8;
}
</style>
