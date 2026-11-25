<script setup lang="ts">
import { computed } from 'vue';
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/vue';
import { imageClasses, type ImageProps } from '@golemui/gui-shared/internals';

const props = defineProps<WithWidget>();
const widget = props.widget as DisplayWidget;
const { domId, templateData } = useDisplayWidget<ImageProps>(widget);
const classes = computed(() =>
  imageClasses({ ratio: templateData.value.ratio, fit: templateData.value.fit }),
);
// Translated by core: a string here. An empty alt marks a decorative image.
const alt = computed(() => (templateData.value.alt as string | undefined) ?? '');
</script>

<template>
  <div class="gui-image-field gui-field">
    <figure :id="domId" :class="classes">
      <img
        :src="templateData.src"
        :alt="alt"
        :loading="templateData.loading || 'lazy'"
        decoding="async"
      />
      <figcaption v-if="templateData.caption">{{ templateData.caption }}</figcaption>
    </figure>
  </div>
</template>
