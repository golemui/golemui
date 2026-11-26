<script setup lang="ts">
import type { ActionWidget, WithWidget } from '@golemui/core';
import { useActionWidget } from '@golemui/vue';
import { tooltipId, tooltipText, type ButtonProps } from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/button';
import '@golemui/gui-components/tooltip';

const props = defineProps<WithWidget>();
const widget = props.widget as ActionWidget;
const { uid, domId, formName, templateData, invalid, onClick } =
  useActionWidget<ButtonProps>(widget);

// Mirror the Lit element's class-field defaults so Vue never sends '' or undefined
// to an enum prop (which Lit's String converter would coerce to '', overriding the default).
const variant = computed(() => templateData.value.variant || 'filled');
const iconPosition = computed(() => templateData.value.iconPosition || 'left');
const tooltip = computed(() => tooltipText(templateData.value.tooltip));
const tipId = tooltipId(domId);
</script>

<template>
  <div
    class="gui-button gui-field"
    :class="{ 'gui-button--invalid': invalid && templateData.actionType === 'submit' }"
  >
    <gui-button
      :uid="uid"
      :id-prefix="formName"
      :type="templateData.actionType ?? 'button'"
      :label="templateData.label"
      :disabled="templateData.disabled"
      :variant.prop="variant"
      :icon="templateData.icon"
      :iconPosition.prop="iconPosition"
      :buttonAriaLabel="templateData.ariaLabel"
      :aria-describedby="tooltip ? tipId : undefined"
      @click="onClick"
    />
    <gui-tooltip v-if="tooltip" :id="tipId" role="tooltip" popover="manual" :for="domId">{{
      tooltip
    }}</gui-tooltip>
  </div>
</template>
