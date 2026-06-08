<script setup lang="ts">
import type { ActionWidget, WithWidget } from '@golemui/core';
import { useActionWidget } from '@golemui/vue';
import type { ButtonProps } from '@golemui/gui-shared';
import { computed } from 'vue';
import '@golemui/gui-components/button';

const props = defineProps<WithWidget>();
const widget = props.widget as ActionWidget;
const { uid, templateData, invalid, onClick } = useActionWidget<ButtonProps>(widget);

// Mirror the Lit element's class-field defaults so Vue never sends '' or undefined
// to an enum prop (which Lit's String converter would coerce to '', overriding the default).
const variant = computed(() => templateData.value.variant || 'filled');
const iconPosition = computed(() => templateData.value.iconPosition || 'left');
</script>

<template>
  <div class="gui-button gui-field" :style="{ flex: templateData.size }">
    <gui-button
      :uid="uid"
      :actionType="templateData.actionType ?? 'button'"
      :label="templateData.label"
      :disabled="templateData.disabled"
      :invalid.prop="invalid"
      :variant.prop="variant"
      :icon="templateData.icon"
      :iconPosition.prop="iconPosition"
      @click="onClick"
    />
  </div>
</template>
