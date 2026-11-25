<script setup lang="ts">
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/vue';
import type { BadgeProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/badge';

const props = defineProps<WithWidget>();
const widget = props.widget as DisplayWidget;
const { domId, templateData } = useDisplayWidget<BadgeProps>(widget);
</script>

<template>
  <div class="gui-badge gui-field">
    <gui-badge :id="domId" :variant="templateData.level || 'default'">
      {{ templateData.text }}
    </gui-badge>
  </div>
</template>
