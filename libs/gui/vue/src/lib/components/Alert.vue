<script setup lang="ts">
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/vue';
import type { AlertProps } from '@golemui/gui-shared';

const props = defineProps<WithWidget>();
const widget = props.widget as DisplayWidget;
const { uid, templateData } = useDisplayWidget<AlertProps>(widget);
</script>

<template>
  <div class="gui-alert gui-field" :style="{ flex: templateData.size }">
    <div class="gui-widget" :id="uid">
      <div
        role="alert"
        :class="`gui-alert-notification gui-alert-notification--${templateData.level || 'default'}`"
      >
        {{ templateData.text }}
      </div>
    </div>
  </div>
</template>
