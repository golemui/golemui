<script setup lang="ts">
// The grid layout, and the deprecated flex layout, which renders as a grid.
import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/vue';
import {
  type FlexProps,
  gridCellClasses,
  gridClasses,
  type GridProps,
  resolveGrid,
} from '@golemui/gui-shared/internals';
import { computed } from 'vue';

const props = defineProps<WithWidget>();
const widget = props.widget as LayoutWidget;
const { uid, children, templateData } = useLayoutWidget<GridProps & FlexProps>(widget);

const grid = computed(() => resolveGrid(widget.type, templateData.value));
</script>

<template>
  <div class="gui-field">
    <div :class="gridClasses(grid)" :id="uid">
      <div
        v-for="child in children as NonFunctionWidget<string>[]"
        :key="child.uid"
        :class="gridCellClasses(grid, child.size)"
      >
        <WidgetRenderer :widget="child" />
      </div>
    </div>
  </div>
</template>
