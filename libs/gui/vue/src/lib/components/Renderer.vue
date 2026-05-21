<script setup lang="ts">
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/vue';
import type { RendererProps } from '@golemui/gui-shared';
import type { VNode } from 'vue';

const props = defineProps<WithWidget>();
const widget = props.widget as DisplayWidget;
const { uid, templateData } = useDisplayWidget<RendererProps<VNode | string>>(widget);

// Vue's <component :is="..."> accepts components and functional components, but
// not raw VNodes / strings directly. Wrap the resolved render value in a tiny
// functional component so we can pass strings, VNodes, or already-functional
// returns transparently.
const RenderSlot = () => templateData.value.render as VNode | string;
</script>

<template>
  <div class="gui-renderer gui-field" :style="{ flex: templateData.size }">
    <div class="gui-widget" :id="uid">
      <component :is="RenderSlot" v-if="templateData.render !== undefined && templateData.render !== null" />
    </div>
  </div>
</template>
