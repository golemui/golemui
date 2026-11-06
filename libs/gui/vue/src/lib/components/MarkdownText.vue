<script setup lang="ts">
import { toDomId } from '@golemui/core/internals';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/vue';
import type { MarkdownTextProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/markdown-text';

const props = defineProps<WithWidget>();
const widget = props.widget as DisplayWidget;
const { uid, formName, templateData } = useDisplayWidget<MarkdownTextProps>(widget);
const domId = toDomId(formName, uid.value);
</script>

<template>
  <div class="gui-markdown-text gui-field">
    <div class="gui-widget" :id="domId">
      <gui-markdown-text :md="templateData.md" :dependencies="templateData.deps" />
    </div>
  </div>
</template>
