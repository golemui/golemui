<script setup lang="ts">
import type { LayoutWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/vue';
import {
  gridCellClasses,
  gridClasses,
  type GridProps,
  resolveGrid,
} from '@golemui/gui-shared/internals';
import { computed } from 'vue';

const props = defineProps<WithWidget>();
const widget = props.widget as LayoutWidget;
const { domId, children, templateData } = useLayoutWidget<GridProps>(widget);

const grid = computed(() => resolveGrid(templateData.value));
</script>

<template>
  <div class="gui-field">
    <div :class="gridClasses(grid)" :id="domId">
      <div v-for="child in children" :key="child.uid" :class="gridCellClasses(grid, child.size)">
        <WidgetRenderer :widget="child" />
      </div>
    </div>
  </div>
</template>
