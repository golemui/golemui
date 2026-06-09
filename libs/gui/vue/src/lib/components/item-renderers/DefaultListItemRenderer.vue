<script setup lang="ts">
import { computed } from 'vue';
import type { OptionValue } from '@golemui/gui-shared/internals';
import type { ListItemRendererProps } from './props';

const props = defineProps<ListItemRendererProps<OptionValue>>();

const classes = computed(() =>
  [
    'gui-list__item',
    props.disabled ? 'gui-list__item-disabled' : '',
    props.selected ? 'gui-list__item-selected' : '',
    props.focused ? 'gui-list__item-focused' : '',
  ]
    .filter(Boolean)
    .join(' '),
);
</script>

<template>
  <div role="option" :class="classes" :aria-selected="selected">
    {{ template }}
  </div>
</template>
