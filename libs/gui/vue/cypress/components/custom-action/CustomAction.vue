<script setup lang="ts">
import type { ActionWidget, WithWidget } from '@golemui/core';
import { useActionWidget } from '@golemui/vue';

const props = defineProps<WithWidget>();
const { uid, templateData, onClick } = useActionWidget<{ label?: string }>(
  props.widget as ActionWidget,
);
</script>

<template>
  <button :id="uid" type="button" data-cy="custom-action" @click="onClick">
    {{ templateData.label }}
  </button>
</template>
