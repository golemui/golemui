<script setup lang="ts">
import type { LayoutWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/vue';
import type { GuiToggleEventDetail } from '@golemui/gui-components';
import {
  sidebarRegions,
  sidebarSideId,
  sidebarSideLabel,
  sidebarToggleLabel,
  type SidebarProps,
} from '@golemui/gui-shared/internals';
import { computed } from 'vue';
import '@golemui/gui-components/sidebar';

// The sidebar layout widget: the side child next to the main one, with `gui-sidebar`. Below
// 768px of its own width the side region becomes a drawer the toggle opens: the same element, so
// the side child is rendered once and keeps its state.
const props = defineProps<WithWidget>();
const widget = props.widget as LayoutWidget;
const { uid, domId, children, templateData, onChange } = useLayoutWidget<SidebarProps>(widget);

const regions = computed(() => sidebarRegions(widget.uid, widget.children, children.value));
const sideId = computed(() => sidebarSideId(domId));

// A menu inside reports its groups with gui-toggle too: only the drawer's counts.
const onToggle = (event: CustomEvent<GuiToggleEventDetail>) => {
  if (event.target !== event.currentTarget) return;
  onChange({ open: event.detail.open });
};
</script>

<template>
  <div class="gui-sidebar gui-field">
    <gui-sidebar
      :id="domId"
      :side="templateData.side"
      :side-size="templateData.sideSize"
      @gui-toggle="onToggle"
    >
      <template v-if="regions.side">
        <button
          type="button"
          class="gui-sidebar__toggle"
          :popovertarget="sideId"
          :aria-label="sidebarToggleLabel(templateData.toggleLabel)"
          :data-cy="`${uid}_toggle`"
        ></button>
        <aside
          class="gui-sidebar__side"
          :id="sideId"
          popover
          :aria-label="sidebarSideLabel(templateData.sideLabel)"
          :data-cy="`${uid}_side`"
        >
          <WidgetRenderer :widget="regions.side" />
        </aside>
      </template>
      <div class="gui-sidebar__main" :data-cy="`${uid}_main`">
        <WidgetRenderer v-if="regions.main" :widget="regions.main" />
      </div>
    </gui-sidebar>
  </div>
</template>
