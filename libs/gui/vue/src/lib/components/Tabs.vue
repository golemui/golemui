<script setup lang="ts">
import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/vue';
import type { GuiTabChangeEventDetail } from '@golemui/gui-components';
import {
  repeaterIndexSuffix,
  tabButtonId,
  tabPanelId,
  type TabsProps,
} from '@golemui/gui-shared/internals';
import { computed, ref, watch } from 'vue';
import '@golemui/gui-components/tabs';

const props = defineProps<WithWidget>();
const widget = props.widget as LayoutWidget;
const { uid, children, templateData, onChange } = useLayoutWidget<TabsProps>(widget);

const activeTab = ref<string | undefined>(templateData.value.defaultOpen);
// Tab uids come from the props without row indexes, the panel children come from the store with
// them, so the lookup adds this layout's own suffix.
const rowIndexSuffix = repeaterIndexSuffix(widget.uid);

watch(
  () => templateData.value.defaultOpen,
  (value) => {
    if (value) activeTab.value = value;
  },
);

// Panels are built from the tab list, not from the children, so a tab and its panel always carry
// the same uid. A tab whose child is hidden by a `when` keeps its header and gets no panel.
const panels = computed(() => {
  const tabs = templateData.value.tabs ?? [];
  const active = activeTab.value ?? tabs[0]?.uid;
  const sections = children.value as NonFunctionWidget<string>[];

  return tabs
    .map((tab) => ({
      tab,
      child: sections.find((section) => section.uid === `${tab.uid}${rowIndexSuffix}`),
      isActive: tab.uid === active,
    }))
    .filter(
      ({ child, isActive }) =>
        child !== undefined && (isActive || templateData.value.renderMode !== 'activeOnly'),
    );
});

const onTabChange = (event: CustomEvent<GuiTabChangeEventDetail>) => {
  // A tab set nested in a panel fires its own.
  if (event.target !== event.currentTarget) return;
  activeTab.value = event.detail.value;
  onChange(event.detail.value);
};
</script>

<template>
  <div class="gui-tabs gui-field">
    <gui-tabs :id="uid" :active.prop="activeTab" @gui-tab-change="onTabChange">
      <gui-tab-list>
        <gui-tab
          v-for="tab in templateData.tabs"
          :key="tab.uid"
          :panel="tab.uid"
          :id="tabButtonId(widget.uid, tab.uid)"
          :data-cy="tabButtonId(widget.uid, tab.uid)"
        >
          {{ tab.label }}
        </gui-tab>
      </gui-tab-list>
      <gui-tab-panel
        v-for="panel in panels"
        :key="panel.tab.uid"
        :name="panel.tab.uid"
        :id="tabPanelId(widget.uid, panel.tab.uid)"
        :data-cy="tabPanelId(widget.uid, panel.tab.uid)"
        :hidden="!panel.isActive"
      >
        <WidgetRenderer :widget="panel.child!" />
      </gui-tab-panel>
    </gui-tabs>
  </div>
</template>
