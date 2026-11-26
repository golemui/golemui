<script setup lang="ts">
import type { ActionWidget, WithWidget } from '@golemui/core';
import { useActionWidget } from '@golemui/vue';
import type { GuiActionEventDetail } from '@golemui/gui-components';
import {
  DEFAULT_MENU_BUTTON_PLACEMENT,
  isMenuButtonSeparator,
  menuButtonAriaLabel,
  menuButtonClasses,
  menuButtonPanelId,
  widgetTooltip,
  type MenuButtonProps,
} from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/menu-button';
import '@golemui/gui-components/tooltip';

// The menuButton action widget: a button that opens a menu of actions, with `gui-menu-button`.
// Picking an item emits the widget's `click` event with `{ value }` as its detail.
const props = defineProps<WithWidget>();
const widget = props.widget as ActionWidget;
const { uid, domId, templateData, emitClick } = useActionWidget<MenuButtonProps>(widget);

const panelId = computed(() => menuButtonPanelId(domId));
const buttonClasses = computed(() => menuButtonClasses(templateData.value));
const tooltip = computed(() =>
  widgetTooltip(
    domId,
    templateData.value.tooltip,
    templateData.value.label,
    templateData.value.ariaLabel,
  ),
);
const ariaLabel = computed(() =>
  menuButtonAriaLabel(
    templateData.value.label,
    tooltip.value?.type === 'label' ? tooltip.value.text : templateData.value.ariaLabel,
  ),
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
        :id="domId"
        :class="buttonClasses"
        :data-cy="`${uid}_button`"
        :popovertarget="panelId"
        :aria-label="ariaLabel"
        :aria-describedby="tooltip?.type === 'description' ? tooltip.id : undefined"
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
    <gui-tooltip
      v-if="tooltip"
      :id="tooltip.id"
      role="tooltip"
      popover="manual"
      :for="domId"
      :type.prop="tooltip.type"
    >
      {{ tooltip.text }}
    </gui-tooltip>
    <gui-menu-button
      :placement.prop="templateData.placement ?? DEFAULT_MENU_BUTTON_PLACEMENT"
      @gui-action="onAction"
    >
      <div :id="panelId" :data-cy="menuButtonPanelId(uid)" popover>
        <template v-for="(item, index) in templateData.items ?? []" :key="index">
          <hr v-if="isMenuButtonSeparator(item)" />
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
    </gui-menu-button>
  </div>
</template>
