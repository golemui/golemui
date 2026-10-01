<script setup lang="ts">
import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/vue';
import type { GuiToggleEventDetail } from '@golemui/gui-components';
import {
  accordionButtonId,
  accordionSectionId,
  type AccordionProps,
  repeaterIndexSuffix,
} from '@golemui/gui-shared/internals';
import { computed, ref, watch, type WatchStopHandle } from 'vue';
import '@golemui/gui-components/accordion';

const props = defineProps<WithWidget>();
const widget = props.widget as LayoutWidget;
const { uid, children, templateData, onChange } = useLayoutWidget<AccordionProps>(widget);

const activeSections = ref<NonNullable<AccordionProps['defaultOpen']>>({});
let initialized = false;

// Seed `activeSections` from `defaultOpen` the first time templateData carries it. The view model
// emits on subscribe, so templateData is already filled here unless the accordion starts hidden.
// Reference-equality against a sentinel like React does is not possible because `ref({})` wraps
// the object in a reactive proxy, breaking identity checks.
// `let`, because `immediate: true` runs the callback synchronously before `watch` returns, so the
// handle is still undefined on that first run. The synchronous case is stopped right after.
let stopSeedWatch: WatchStopHandle | undefined;
stopSeedWatch = watch(
  templateData,
  (td) => {
    if (!initialized && td.defaultOpen) {
      activeSections.value = { ...td.defaultOpen };
      initialized = true;
      // Nothing left to seed, so stop deep-watching all of templateData.
      stopSeedWatch?.();
    }
  },
  { immediate: true, deep: true },
);
if (initialized) {
  stopSeedWatch();
}

const onToggle = (event: CustomEvent<GuiToggleEventDetail>, sectionUid: string) => {
  // An accordion nested in a section fires its own.
  if (event.target !== event.currentTarget) return;
  const { open } = event.detail;
  if (isOpen(sectionUid) === open) return;

  const next: typeof activeSections.value = { ...activeSections.value };
  if (open && templateData.value.singleOpen) {
    Object.keys(next).forEach((key) => {
      next[key] = false;
    });
  }
  next[sectionUid] = open;
  activeSections.value = next;
  onChange(next);
};

// Section uids come from the props without row indexes, the children come from the store with
// them, so the lookup adds this accordion's own suffix. Undefined when the child is hidden.
const rowIndexSuffix = repeaterIndexSuffix(widget.uid);
const sectionForUid = (sectionUid: string) =>
  (children.value as NonFunctionWidget<string>[]).find(
    (s) => s.uid === `${sectionUid}${rowIndexSuffix}`,
  );

const isOpen = (sectionUid: string) => Boolean(activeSections.value[sectionUid]);

const shouldRenderContent = (sectionUid: string) =>
  isOpen(sectionUid) || templateData.value.renderMode !== 'activeOnly';

const sections = computed(() => templateData.value.sections || []);
</script>

<template>
  <div class="gui-accordion gui-field" :style="{ flex: templateData.size }">
    <gui-accordion :id="uid" :multiple.prop="!templateData.singleOpen">
      <gui-accordion-item
        v-for="section in sections"
        :key="section.uid"
        :open.prop="isOpen(section.uid)"
        @gui-toggle="onToggle($event, section.uid)"
      >
        <details :open="isOpen(section.uid)">
          <summary :id="accordionButtonId(widget.uid, section.uid)">
            {{ section.label }}
          </summary>
          <section
            v-if="shouldRenderContent(section.uid) && sectionForUid(section.uid)"
            class="gui-widget"
            role="region"
            :id="accordionSectionId(widget.uid, section.uid)"
            :aria-labelledby="accordionButtonId(widget.uid, section.uid)"
          >
            <WidgetRenderer :widget="sectionForUid(section.uid)!" />
          </section>
        </details>
      </gui-accordion-item>
    </gui-accordion>
  </div>
</template>
