<script setup lang="ts">
import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/vue';

type OwnWidgetProps = {
  title?: string;
};

const props = defineProps<WithWidget>();
const { uid, children, templateData } = useLayoutWidget<OwnWidgetProps>(
  props.widget as LayoutWidget,
);
</script>

<template>
  <section :id="uid" data-cy="custom-layout">
    <h4 data-cy="custom-layout-title">{{ templateData.title }}</h4>
    <WidgetRenderer
      v-for="child in children as NonFunctionWidget<string>[]"
      :key="child.uid"
      :widget="child"
    />
  </section>
</template>
