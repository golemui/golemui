<script setup lang="ts">
import type { ActionWidget, WithWidget } from '@golemui/core';
import { useActionWidget } from '@golemui/vue';
import type { GuiActionEventDetail, GuiMenuToggleEventDetail } from '@golemui/gui-components';
import { menuOpenGroups, toggleMenuGroup, type MenuProps } from '@golemui/gui-shared/internals';
import { computed, ref, watch } from 'vue';
import MenuItems from './MenuItems.vue';
import '@golemui/gui-components/menu';

// The menu action widget: a navigation menu, with `gui-menu`. Picking a destination emits the
// widget's `click` event with `{ value }` as its detail; a group's button only opens the group.
// The groups that hold `current` open when it changes, and the user's own toggles stay until then.
const props = defineProps<WithWidget>();
const widget = props.widget as ActionWidget;
const { uid, domId, templateData, emitClick } = useActionWidget<MenuProps>(widget);

const open = ref<string[]>([]);
watch(
  () => templateData.value.current,
  (current) => (open.value = menuOpenGroups(open.value, templateData.value.items, current)),
  { immediate: true },
);

const horizontal = computed(() => templateData.value.orientation === 'horizontal');
const name = computed(() => {
  const label = templateData.value.label;
  return typeof label === 'string' && label !== '' ? label : undefined;
});

const onAction = (event: CustomEvent<GuiActionEventDetail>) => {
  emitClick({ value: event.detail.value });
};

// The element has opened or closed the group already: the state follows it.
const onToggle = (event: CustomEvent<GuiMenuToggleEventDetail>) => {
  open.value = toggleMenuGroup(open.value, event.detail.value, event.detail.open);
};
</script>

<template>
  <div class="gui-menu gui-field">
    <gui-menu
      :orientation="horizontal ? 'horizontal' : undefined"
      @gui-action="onAction"
      @gui-toggle="onToggle"
    >
      <nav :id="domId" :aria-label="name">
        <ul>
          <MenuItems
            :items="templateData.items"
            :dropdowns="horizontal"
            :uid="uid"
            :dom-id="domId"
            :current="templateData.current"
            :disabled="templateData.disabled === true"
            :open="open"
          />
        </ul>
      </nav>
    </gui-menu>
  </div>
</template>
