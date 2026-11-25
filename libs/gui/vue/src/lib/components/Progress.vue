<script setup lang="ts">
import type { DisplayWidget, WithWidget } from '@golemui/core';
import { useDisplayWidget } from '@golemui/vue';
import type { ProgressProps } from '@golemui/gui-shared/internals';
import '@golemui/gui-components/progress';

const props = defineProps<WithWidget>();
const widget = props.widget as DisplayWidget;
const { uid, formName, templateData } = useDisplayWidget<ProgressProps>(widget);
</script>

<template>
  <div class="gui-progress gui-field">
    <!-- Vue writes 0 into a number property bound to undefined: NaN keeps the bar indeterminate. -->
    <gui-progress
      :uid="uid"
      :id-prefix="formName"
      :label="templateData.label"
      :value="templateData.value ?? NaN"
      :max="templateData.max ?? 100"
      :show-value="templateData.showValue"
      :locale-id="templateData.lang"
    ></gui-progress>
  </div>
</template>
