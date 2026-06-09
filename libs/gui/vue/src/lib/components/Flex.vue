<script setup lang="ts">
import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/vue';
import type { FlexProps } from '@golemui/gui-shared/internals';
import { computed } from 'vue';

const props = defineProps<WithWidget>();
const widget = props.widget as LayoutWidget;
const { uid, children, templateData } = useLayoutWidget<FlexProps>(widget);

const widgetClass = computed(() => {
  const direction = `gui-flex__widget--${templateData.value.direction ?? 'column'}`;
  const justify = `gui-flex__widget--justify-${(templateData.value.justify as string) ?? 'stretch'}`;
  const align = `gui-flex__widget--align-${(templateData.value.align as string) ?? 'start'}`;
  return `gui-flex__widget ${direction} ${justify} ${align}`;
});

const gapStyle = computed(() =>
  templateData.value.gap ? { gap: `${templateData.value.gap}px` } : {},
);
</script>

<template>
  <div class="gui-flex gui-field" :style="{ flex: templateData.size }">
    <div :class="widgetClass" :style="gapStyle" :id="uid">
      <WidgetRenderer
        v-for="child in children as NonFunctionWidget<string>[]"
        :key="child.uid"
        :widget="child"
      />
    </div>
  </div>
</template>
