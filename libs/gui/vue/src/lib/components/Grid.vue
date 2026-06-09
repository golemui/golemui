<script setup lang="ts">
import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/vue';
import type { GridProps } from '@golemui/gui-shared/internals';
import { computed, type CSSProperties } from 'vue';

const props = defineProps<WithWidget>();
const widget = props.widget as LayoutWidget;
const { uid, children, templateData } = useLayoutWidget<GridProps>(widget);

const isRow = computed(() => templateData.value.direction !== 'column');

const widgetClass = computed(() => {
  const direction = isRow.value ? 'gui-grid__widget--row' : 'gui-grid__widget--column';
  const autoFit =
    isRow.value && (templateData.value.autoFit ?? true) ? 'gui-grid__widget--row--auto-fit' : '';
  const align = `gui-grid__widget--align-${(templateData.value.align as string) ?? 'stretch'}`;
  const justify = templateData.value.justify
    ? `gui-grid__widget--justify-${templateData.value.justify as string}`
    : '';
  return `gui-grid__widget ${direction} ${autoFit} ${align} ${justify}`;
});

const widgetStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {};
  if (templateData.value.columnGap !== undefined)
    style.columnGap = `${templateData.value.columnGap}px`;
  if (templateData.value.rowGap !== undefined) style.rowGap = `${templateData.value.rowGap}px`;
  return style;
});
</script>

<template>
  <div class="gui-grid gui-field" :style="{ flex: templateData.size }">
    <div :class="widgetClass" :style="widgetStyle" :id="uid">
      <div
        v-for="child in children as NonFunctionWidget<string>[]"
        :key="child.uid"
        class="gui-grid__cell"
        :style="{ gridColumn: `span ${child.size || 1}` }"
      >
        <WidgetRenderer :widget="child" />
      </div>
    </div>
  </div>
</template>
