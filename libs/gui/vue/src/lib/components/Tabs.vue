<script setup lang="ts">
import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/vue';
import { createIntersectionObserver } from '@golemui/gui-components/internals';
import { repeaterIndexSuffix, type TabsProps } from '@golemui/gui-shared/internals';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps<WithWidget>();
const widget = props.widget as LayoutWidget;
const { uid, children, templateData, onChange } = useLayoutWidget<TabsProps>(widget);

const containerRef = ref<HTMLDivElement | null>(null);
const tabRefs = ref<HTMLButtonElement[]>([]);
const startSentinelRef = ref<HTMLLIElement | null>(null);
const endSentinelRef = ref<HTMLLIElement | null>(null);
const isStartVisible = ref(false);
const isEndVisible = ref(false);
const activeTab = ref<string | undefined>(templateData.value.defaultOpen);
// Tab uids come from the props without row indexes, the panel children come from the store with
// them, so the comparison adds this layout's own suffix.
const rowIndexSuffix = repeaterIndexSuffix(widget.uid);
const activeChildUid = computed(() => `${activeTab.value ?? ''}${rowIndexSuffix}`);

let startObserver: { disconnect(): void } | null = null;
let endObserver: { disconnect(): void } | null = null;

onMounted(() => {
  if (startSentinelRef.value) {
    startObserver = createIntersectionObserver(startSentinelRef.value, (intersecting) => {
      isStartVisible.value = intersecting;
    });
  }
  if (endSentinelRef.value) {
    endObserver = createIntersectionObserver(endSentinelRef.value, (intersecting) => {
      isEndVisible.value = intersecting;
    });
  }
});

onUnmounted(() => {
  startObserver?.disconnect();
  endObserver?.disconnect();
});

watch(
  () => templateData.value.tabs,
  (tabs) => {
    if (activeTab.value === undefined && tabs?.length > 0) {
      activeTab.value = tabs[0].uid;
    }
  },
  { immediate: true },
);

watch(
  () => templateData.value.defaultOpen,
  (val) => {
    if (val) activeTab.value = val;
  },
);

watch(activeTab, (next) => {
  const tabs = templateData.value.tabs || [];
  const idx = tabs.findIndex((tab) => tab.uid === next);
  if (idx > -1) {
    tabRefs.value[idx]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
});

const handleTabChange = (newUid: string) => {
  activeTab.value = newUid;
  onChange(newUid);
};

const onKeyDown = (event: KeyboardEvent) => {
  const tabs = templateData.value.tabs;
  const currentIndex = tabs.findIndex((tab) => tab.uid === activeTab.value);
  const isRTL = containerRef.value
    ? window.getComputedStyle(containerRef.value).direction === 'rtl'
    : false;
  let nextIndex: number | null = null;
  switch (event.key) {
    case 'ArrowLeft':
      nextIndex = currentIndex + (isRTL ? 1 : -1);
      break;
    case 'ArrowRight':
      nextIndex = currentIndex + (isRTL ? -1 : 1);
      break;
    case 'Home':
      nextIndex = 0;
      break;
    case 'End':
      nextIndex = tabs.length - 1;
      break;
    default:
      return;
  }
  if (nextIndex !== null && nextIndex >= 0 && nextIndex < tabs.length) {
    handleTabChange(tabs[nextIndex].uid);
    tabRefs.value[nextIndex]?.focus();
  }
};

const setTabRef = (idx: number) => (el: any) => {
  if (el) tabRefs.value[idx] = el as HTMLButtonElement;
};

const visibleSections = computed(() => {
  const renderMode = templateData.value.renderMode;
  return (children.value as NonFunctionWidget<string>[]).filter(
    (section) => section.uid === activeChildUid.value || renderMode !== 'activeOnly',
  );
});
</script>

<template>
  <div ref="containerRef" class="gui-tabs gui-field" :style="{ flex: templateData.size }">
    <nav
      :id="uid"
      :class="{
        'gui-widget': true,
        'gui-widget--horizontal': true,
        'gui-tabs--start-shadow': !isStartVisible,
        'gui-tabs--end-shadow': !isEndVisible,
      }"
    >
      <ul role="tablist">
        <li
          ref="startSentinelRef"
          role="presentation"
          class="gui-sentinel gui-sentinel__start"
        ></li>
        <li
          v-for="(tab, index) in templateData.tabs"
          :key="`tab_${widget.uid}_${tab.uid}`"
          role="presentation"
        >
          <button
            :ref="setTabRef(index)"
            type="button"
            role="tab"
            :tabindex="tab.uid === activeTab ? 0 : -1"
            :data-cy="`tab_${widget.uid}_${index}`"
            :id="`tab_${widget.uid}_${index}`"
            :aria-controls="`tabpanel_${widget.uid}_${index}`"
            :aria-selected="tab.uid === activeTab ? 'true' : 'false'"
            :class="tab.uid === activeTab ? 'active' : ''"
            @click="handleTabChange(tab.uid)"
            @keydown="onKeyDown"
            @focus="
              (e) =>
                (e.target as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'nearest' })
            "
          >
            {{ tab.label }}
          </button>
        </li>
        <li ref="endSentinelRef" role="presentation" class="gui-sentinel gui-sentinel__end"></li>
      </ul>
    </nav>
    <section
      v-for="(section, idx) in visibleSections"
      :key="`tabpanel_${widget.uid}_${section.uid}`"
      role="tabpanel"
      tabindex="0"
      :data-cy="`tabpanel_${widget.uid}_${idx}`"
      :id="`tabpanel_${widget.uid}_${idx}`"
      :hidden="section.uid !== activeChildUid && templateData.renderMode !== 'activeOnly'"
      :aria-labelledby="`tab_${widget.uid}_${idx}`"
    >
      <WidgetRenderer :widget="section" />
    </section>
  </div>
</template>
