<script setup lang="ts">
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/vue';
import type { SpinnerProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/spinner';

const props = defineProps<WithWidget>();
const widget = props.widget as DisplayWidget;
const { domId, templateData } = useDisplayWidget<SpinnerProps>(widget);
</script>

<template>
  <div class="gui-spinner gui-field">
    <gui-spinner :id="domId" :label="templateData.label"></gui-spinner>
  </div>
</template>
