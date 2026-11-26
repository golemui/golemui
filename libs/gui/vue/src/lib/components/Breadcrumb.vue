<script setup lang="ts">
import type { ActionWidget, WithWidget } from '@golemui/core';
import { useActionWidget } from '@golemui/vue';
import type { GuiActionEventDetail } from '@golemui/gui-components';
import {
  breadcrumbLabel,
  breadcrumbTrail,
  type BreadcrumbProps,
} from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/breadcrumb';

// The breadcrumb action widget: a trail to the current page, with `gui-breadcrumb`. Picking a
// step emits the widget's `click` event with `{ value }` as its detail.
const props = defineProps<WithWidget>();
const widget = props.widget as ActionWidget;
const { uid, domId, templateData, emitClick } = useActionWidget<BreadcrumbProps>(widget);

const name = computed(() => breadcrumbLabel(templateData.value.label));
const trail = computed(() => breadcrumbTrail(templateData.value.items));

const onAction = (event: CustomEvent<GuiActionEventDetail>) => {
  emitClick({ value: event.detail.value });
};
</script>

<template>
  <div class="gui-breadcrumb gui-field">
    <gui-breadcrumb @gui-action="onAction">
      <nav :id="domId" :aria-label="name">
        <ol>
          <li v-for="step in trail" :key="step.value">
            <span v-if="step.current" aria-current="page" :data-cy="`${uid}_item_${step.value}`">{{
              step.label
            }}</span>
            <button
              v-else
              type="button"
              :value="step.value"
              :data-cy="`${uid}_item_${step.value}`"
              :disabled="templateData.disabled === true"
            >
              {{ step.label }}
            </button>
          </li>
        </ol>
      </nav>
    </gui-breadcrumb>
  </div>
</template>
