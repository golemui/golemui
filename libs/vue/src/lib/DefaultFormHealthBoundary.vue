<script setup lang="ts">
import type { FormHealth } from '@golemui/core';

/** Default boundary: prepends a red banner when health is errored, otherwise renders the form (default slot) alone. Override via the `formHealthBoundary` prop. */
defineProps<{ health: FormHealth }>();
</script>

<template>
  <div
    v-if="health.status === 'errored'"
    class="gui-form-health-error"
    role="alert"
    style="border: 2px solid red; border-radius: 4px; padding: 12px; margin-bottom: 8px"
  >
    <strong style="color: red">GolemUI form error</strong>
    <p style="margin-top: 4px">
      <code>{{ health.message }}</code>
    </p>
  </div>
  <slot />
</template>
