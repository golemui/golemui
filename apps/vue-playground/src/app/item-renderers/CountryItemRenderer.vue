<script setup lang="ts">
import type { ListItemRendererProps } from '@golemui/gui-vue';

type CountryItem = {
  id: string;
  label: string;
  flag: string;
};

defineProps<ListItemRendererProps<CountryItem>>();
</script>

<template>
  <div
    :class="{
      'country-renderer': true,
      disabled: !!disabled,
      selected: !!selected,
      focused: !!focused,
      odd: index % 2 === 0,
    }"
  >
    <span>{{ template?.label }}</span>
    <span>{{ template?.flag }}</span>
  </div>
</template>

<style scoped>
.country-renderer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  cursor: pointer;
  height: 100%;
  background-color: var(--gui-bg-default);
}
.country-renderer.odd {
  background-color: #ecf6ff;
}
.country-renderer.selected {
  color: var(--gui-text-default);
  background-color: var(--gui-bg-default);
  font-weight: bold;
}
.country-renderer.focused {
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--gui-text-default) 25%, transparent);
}
@media (prefers-color-scheme: dark) {
  .country-renderer.odd {
    background-color: #2c303c;
  }
  .country-renderer.selected {
    color: var(--gui-intent-primary-hover);
    background-color: var(--gui-intent-primary);
    font-weight: bold;
  }
}
</style>
