<script setup lang="ts">
import { toDomId } from '@golemui/core/internals';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/vue';
import type { AlertProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/alert';

const props = defineProps<WithWidget>();
const widget = props.widget as DisplayWidget;
const { uid, formName, templateData } = useDisplayWidget<AlertProps>(widget);
const domId = toDomId(formName, uid.value);
</script>

<template>
  <div class="gui-alert gui-field">
    <gui-alert :id="domId" :variant="templateData.level || 'default'">
      {{ templateData.text }}
    </gui-alert>
  </div>
</template>
