<script setup lang="ts">
import { useLayoutWidget, WidgetRenderer } from '@golemui/vue';
import type { LayoutWidget } from '@golemui/core';

const props = defineProps<{ widget: LayoutWidget<string> }>();
const { children } = useLayoutWidget(props.widget);
</script>

<template>
  <div class="flex-layout-demo" :data-uid="widget.uid">
    <WidgetRenderer
      v-for="child in (children as any[])"
      :key="child.uid"
      :widget="child"
    />
  </div>
</template>

<style scoped>
.flex-layout-demo {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
