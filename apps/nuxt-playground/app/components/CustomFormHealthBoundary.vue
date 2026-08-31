<script setup lang="ts">
import type { FormHealthBoundaryProps } from '@golemui/vue';

defineProps<FormHealthBoundaryProps>();
</script>

<template>
  <div v-if="health.status === 'errored'" role="alert" class="custom-form-health-error">
    <strong>This form could not be loaded</strong>
    <div>{{ health.message }}</div>
  </div>
  <slot />
</template>

<style scoped>
.custom-form-health-error {
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-left: 4px solid #b91c1c;
  border-radius: 4px;
  background: #fef2f2;
  color: #b91c1c;
}
</style>
