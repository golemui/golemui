<script setup lang="ts">
import type { ActionWidget, WithWidget } from '@golemui/core';
import { useActionWidget } from '@golemui/vue';
import type { GuiActionEventDetail } from '@golemui/gui-components';
import {
  DEFAULT_MENU_PLACEMENT,
  isMenuSeparator,
  menuButtonAriaLabel,
  menuButtonClasses,
  menuPanelId,
  type MenuProps,
} from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/menu';

// The menu action widget: a button that opens a `gui-menu` of actions. Picking an item emits the
// widget's `click` event with `{ value }` as its detail.
const props = defineProps<WithWidget>();
const widget = props.widget as ActionWidget;
const { uid, templateData, emitClick } = useActionWidget<MenuProps>(widget);

const panelId = computed(() => menuPanelId(uid.value));
const buttonClasses = computed(() => menuButtonClasses(templateData.value));
const ariaLabel = computed(() =>
  menuButtonAriaLabel(templateData.value.label, templateData.value.ariaLabel),
);
const iconOnRight = computed(() => templateData.value.iconPosition === 'right');

const onAction = (event: CustomEvent<GuiActionEventDetail>) => {
  emitClick({ value: event.detail.value });
};
</script>

<template>
  <div class="gui-menu-button gui-field">
    <div class="gui-widget">
      <button
        type="button"
        :id="uid"
        :class="buttonClasses"
        :data-cy="`${uid}_button`"
        :popovertarget="panelId"
        :aria-label="ariaLabel"
        :disabled="templateData.disabled === true"
      >
        <span
          v-if="templateData.icon && !iconOnRight"
          :class="`gui-widget-icon gui-button-icon ${templateData.icon}`"
          :data-icon="templateData.icon"
          aria-hidden="true"
        ></span>
        <span v-if="templateData.label">{{ templateData.label }}</span>
        <span
          v-if="templateData.icon && iconOnRight"
          :class="`gui-widget-icon gui-button-icon ${templateData.icon}`"
          :data-icon="templateData.icon"
          aria-hidden="true"
        ></span>
      </button>
    </div>
    <gui-menu
      :placement.prop="templateData.placement ?? DEFAULT_MENU_PLACEMENT"
      @gui-action="onAction"
    >
      <div :id="panelId" :data-cy="panelId" popover>
        <template v-for="(item, index) in templateData.items ?? []" :key="index">
          <hr v-if="isMenuSeparator(item)" />
          <button
            v-else
            type="button"
            :value="item.value"
            :data-cy="`${uid}_item_${item.value}`"
            :disabled="item.disabled === true"
          >
            {{ item.label }}
          </button>
        </template>
      </div>
    </gui-menu>
  </div>
</template>
