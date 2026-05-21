<script setup lang="ts">
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/vue';
import type { MarkdownTextProps } from '@golemui/gui-shared';
import '@golemui/gui-components/markdown-text';

const props = defineProps<WithWidget>();
const widget = props.widget as DisplayWidget;
const { uid, templateData } = useDisplayWidget<MarkdownTextProps>(widget);
</script>

<template>
  <div class="gui-markdown-text gui-field" :style="{ flex: templateData.size }">
    <div class="gui-widget" :id="uid">
      <gui-markdown-text :md="templateData.md" :dependencies="templateData.deps" />
    </div>
  </div>
</template>
