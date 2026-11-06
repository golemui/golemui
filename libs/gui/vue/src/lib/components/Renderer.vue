<script setup lang="ts">
import { toDomId } from '@golemui/core/internals';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/vue';
import type { RendererProps } from '@golemui/gui-shared/internals';
import type { VNode } from 'vue';

const props = defineProps<WithWidget>();
const widget = props.widget as DisplayWidget;
const { uid, formName, templateData } = useDisplayWidget<RendererProps<VNode | string>>(widget);
const domId = toDomId(formName, uid.value);

// Vue's <component :is="..."> accepts components and functional components, but
// not raw VNodes / strings directly. Wrap the resolved render value in a tiny
// functional component so we can pass strings, VNodes, or already-functional
// returns transparently.
const RenderSlot = () => templateData.value.render as VNode | string;
</script>

<template>
  <div class="gui-renderer gui-field">
    <div class="gui-widget" :id="domId">
      <component
        :is="RenderSlot"
        v-if="templateData.render !== undefined && templateData.render !== null"
      />
    </div>
  </div>
</template>
