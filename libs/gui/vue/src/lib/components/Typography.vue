<script setup lang="ts">
import { computed } from 'vue';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/vue';
import {
  typographyClasses,
  typographyTag,
  type TypographyProps,
} from '@golemui/gui-shared/internals';

const props = defineProps<WithWidget>();
const widget = props.widget as DisplayWidget;
const { domId, templateData } = useDisplayWidget<TypographyProps>(widget);
const tag = computed(() => typographyTag(templateData.value.variant));
const classes = computed(() => typographyClasses(templateData.value.variant));
</script>

<template>
  <div class="gui-typography-field gui-field">
    <!-- The text on the tag's line: whitespace around it would show, as the text keeps its breaks. -->
    <component :is="tag" :id="domId" :class="classes">{{ templateData.text }}</component>
  </div>
</template>
