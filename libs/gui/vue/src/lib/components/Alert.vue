<script setup lang="ts">
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/vue';
import type { AlertProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/alert';

const props = defineProps<WithWidget>();
const widget = props.widget as DisplayWidget;
const { uid, templateData } = useDisplayWidget<AlertProps>(widget);
</script>

<template>
  <div class="gui-alert gui-field" :style="{ flex: templateData.size }">
    <gui-alert :id="uid" :variant="templateData.level || 'default'">
      {{ templateData.text }}
    </gui-alert>
  </div>
</template>
