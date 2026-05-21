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
  return h(`h${level}`, { class: 'heading' }, templateData.value.text);
});
</script>

<template>
  <div class="gui-widget" :id="uid" data-cy="heading">
    <component :is="Heading" />
  </div>
</template>
