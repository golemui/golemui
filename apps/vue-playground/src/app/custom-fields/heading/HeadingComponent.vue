<script setup lang="ts">
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/vue';
import { computed, h } from 'vue';

type OwnWidgetProps = {
  text: string;
  level?: number;
};

const props = defineProps<WithWidget>();
const widget = props.widget as DisplayWidget;
const { uid, templateData } = useDisplayWidget<OwnWidgetProps>(widget);

const Heading = computed(() => {
  const level = templateData.value.level || 1;
  const tag = `h${level}`;
  return h(tag, { class: 'heading' }, templateData.value.text);
});
</script>

<template>
  <div class="gui-widget" :id="uid">
    <component :is="Heading" />
  </div>
</template>

<style scoped>
.heading {
  color: var(--gui-color-primary);
  margin: 0;
}
</style>
