<script setup lang="ts">
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/vue';
import type { RendererProps } from '@golemui/gui-shared';
import type { VNode } from 'vue';

const props = defineProps<WithWidget>();
const widget = props.widget as DisplayWidget;
const { uid, templateData } = useDisplayWidget<RendererProps<VNode | string>>(widget);
</script>

<template>
  <div class="gui-renderer gui-field" :style="{ flex: templateData.size }">
    <div class="gui-widget" :id="uid">
      <template v-if="typeof templateData.render === 'string'">
        {{ templateData.render }}
      </template>
      <template v-else-if="templateData.render">
        <component :is="templateData.render" />
      </template>
    </div>
  </div>
</template>
