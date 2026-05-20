<script setup lang="ts">
import type { ListItemRendererProps } from '@golemui/gui-vue';

type CurrencyItem = { code: string; symbol: string; name: string };

defineProps<ListItemRendererProps<CurrencyItem>>();
</script>

<template>
  <div
    class="currency-item"
    :class="{ 'is-selected': !!selected, 'is-focused': !!focused }"
  >
    <span class="currency-item__symbol">{{ template?.symbol }}</span>
    <span class="currency-item__code">{{ template?.code }}</span>
    <span class="currency-item__name">{{ template?.name }}</span>
  </div>
</template>

<style scoped>
.currency-item {
  display: grid;
  grid-template-columns: 28px auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  cursor: pointer;
  background-color: var(--gui-bg-default);
}
.currency-item__symbol {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--gui-intent-primary);
  text-align: center;
}
.currency-item__code {
  font-family: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85em;
  color: var(--gui-text-default);
  font-weight: 600;
}
.currency-item__name {
  color: var(--gui-text-muted, #94a3b8);
  font-size: 0.9em;
}
.currency-item.is-selected {
  background-color: var(--gui-intent-primary);
  color: var(--gui-text-default);
}
.currency-item.is-focused {
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--gui-intent-primary-hover) 50%, transparent);
}
</style>
