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
    <span class="gui-list__item-check" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256">
        <path
          d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"
        ></path>
      </svg>
    </span>
    {{ template }}
  </div>
</template>
