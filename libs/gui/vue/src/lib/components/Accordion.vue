<script setup lang="ts">
import type { LayoutWidget, NonFunctionWidget, WithWidget } from '@golemui/core';
import { useLayoutWidget, WidgetRenderer } from '@golemui/vue';
import {
  accordionButtonId,
  accordionSectionId,
  type AccordionProps,
  repeaterIndexSuffix,
} from '@golemui/gui-shared/internals';
import { computed, ref, watch } from 'vue';

const props = defineProps<WithWidget>();
const widget = props.widget as LayoutWidget;
const { uid, children, templateData, onChange } = useLayoutWidget<AccordionProps>(widget);

const activeSections = ref<NonNullable<AccordionProps['defaultOpen']>>({});
let initialized = false;

// Seed `activeSections` from `defaultOpen` the first time templateData carries it. The view model
// emits on subscribe, so templateData is already filled here unless the accordion starts hidden.
// Reference-equality against a sentinel like React does is not possible because `ref({})` wraps
// the object in a reactive proxy, breaking identity checks.
watch(
  templateData,
  (td) => {
    if (!initialized && td.defaultOpen) {
      activeSections.value = { ...td.defaultOpen };
      initialized = true;
    }
  },
  { immediate: true, deep: true },
);

const onClickButton = (sectionUid: string) => {
  const newState: typeof activeSections.value = { ...activeSections.value };
  if (templateData.value.singleOpen) {
    Object.keys(newState)
      .filter((u) => u !== sectionUid)
      .forEach((u) => {
        newState[u] = false;
      });
  }
  newState[sectionUid] = !newState[sectionUid];
  activeSections.value = newState;
  onChange(newState);
};

// Section uids come from the props without row indexes, the children come from the store with
// them, so the lookup adds this accordion's own suffix. Undefined when the child is hidden.
const rowIndexSuffix = repeaterIndexSuffix(widget.uid);
const sectionForUid = (sectionUid: string) =>
  (children.value as NonFunctionWidget<string>[]).find(
    (s) => s.uid === `${sectionUid}${rowIndexSuffix}`,
  );

const isActive = (sectionUid: string) => Boolean(activeSections.value[sectionUid]);

const shouldRenderContent = (sectionUid: string) =>
  isActive(sectionUid) || templateData.value.renderMode !== 'activeOnly';

const sections = computed(() => templateData.value.sections || []);
</script>

<template>
  <div class="gui-accordion gui-field" :style="{ flex: templateData.size }">
    <div class="gui-widget" :id="uid">
      <div
        v-for="section in sections"
        :key="accordionSectionId(widget.uid, section.uid)"
        class="gui-accordion__section"
      >
        <button
          type="button"
          tabindex="0"
          :id="accordionButtonId(widget.uid, section.uid)"
          :aria-controls="accordionSectionId(widget.uid, section.uid)"
          :aria-expanded="isActive(section.uid) ? 'true' : 'false'"
          :class="isActive(section.uid) ? 'active' : ''"
          @click="onClickButton(section.uid)"
        >
          {{ section.label }}
          <span class="gui-accordion__arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
              <path
                d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
              ></path>
            </svg>
          </span>
        </button>
        <section
          v-if="shouldRenderContent(section.uid) && sectionForUid(section.uid)"
          class="gui-widget"
          role="region"
          :id="accordionSectionId(widget.uid, section.uid)"
          :hidden="!isActive(section.uid) && templateData.renderMode !== 'activeOnly'"
          :aria-labelledby="accordionButtonId(widget.uid, section.uid)"
        >
          <WidgetRenderer :widget="sectionForUid(section.uid)!" />
        </section>
      </div>
    </div>
  </div>
</template>
