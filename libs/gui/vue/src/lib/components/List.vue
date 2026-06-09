<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget, useVueFormContext } from '@golemui/vue';
import type { ListItem, ListProps, OptionValue } from '@golemui/gui-shared/internals';
import { computed, onUnmounted, ref, watch, type Component } from 'vue';
import DefaultListItemRenderer from './item-renderers/DefaultListItemRenderer.vue';
import '@golemui/gui-components/label';
import '@golemui/gui-components/list';
import '@golemui/gui-components/errors';

interface GuiListElement extends HTMLElement {
  focusItemAtIndex(index: number): void;
}

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<OptionValue>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  OptionValue,
  ListProps<unknown>
>(widget);

const rangeStart = ref(0);
const rangeEnd = ref(10);
const listItems = ref<ListItem<any>[]>([]);
const focusedIndex = ref<number>(-1);
const listRef = ref<GuiListElement | null>(null);

const visibleItems = computed(() => {
  const items = listItems.value.length > 0 ? listItems.value : templateData.value.items || [];
  return items.slice(rangeStart.value, rangeEnd.value);
});

const required = computed(() => (templateData.value.validator as Validator)?.required);
const isDisabled = computed(() => templateData.value.disabled as boolean);
const isReadOnly = computed(() => templateData.value.readonly as boolean);
const showErrors = computed(() => isTouched.value && errors.value && errors.value.length > 0);

const handleRangeChange = (e: Event) => {
  const { startIndex, endIndex } = (e as CustomEvent).detail;
  rangeStart.value = startIndex;
  rangeEnd.value = endIndex;
};
const handleUpdateItems = (e: Event) => {
  const items = (e as CustomEvent).detail;
  listItems.value = items ? [...items] : [];
};
const handleFocusChange = (e: Event) => {
  focusedIndex.value = (e as CustomEvent).detail.index;
};
const handleChange = (e: Event) => {
  onValueChanged((e as CustomEvent).detail.value);
};

let currentList: GuiListElement | null = null;
watch(listRef, (el) => {
  if (currentList) {
    currentList.removeEventListener('change', handleChange);
    currentList.removeEventListener('gui-update-items', handleUpdateItems);
    currentList.removeEventListener('gui-range-change', handleRangeChange);
    currentList.removeEventListener('gui-focus-change', handleFocusChange);
  }
  currentList = el;
  if (el) {
    el.addEventListener('change', handleChange);
    el.addEventListener('gui-update-items', handleUpdateItems);
    el.addEventListener('gui-range-change', handleRangeChange);
    el.addEventListener('gui-focus-change', handleFocusChange);
  }
});

onUnmounted(() => {
  currentList?.removeEventListener('change', handleChange);
  currentList?.removeEventListener('gui-update-items', handleUpdateItems);
  currentList?.removeEventListener('gui-range-change', handleRangeChange);
  currentList?.removeEventListener('gui-focus-change', handleFocusChange);
});

const handleBlur = (e: FocusEvent) => {
  if (listRef.value && e.relatedTarget && listRef.value.contains(e.relatedTarget as Node)) return;
  onBlur();
};

const handleClickItem = (item: ListItem<any>, index: number) => {
  if (templateData.value.disabled) return;
  onValueChanged(item.value);
  focusedIndex.value = index;
  listRef.value?.focusItemAtIndex(index);
};

const formContext = useVueFormContext();
const ItemRenderer = computed<Component>(() => {
  const renderers = formContext.itemRenderers as Record<string, Component>;
  return (
    renderers[templateData.value.itemRenderer as string] || (DefaultListItemRenderer as Component)
  );
});
</script>

<template>
  <div class="gui-list gui-field" :style="{ flex: templateData.size }">
    <gui-label
      :uid="uid"
      :label="templateData.label"
      :hint="templateData.hint"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :native="false"
    ></gui-label>

    <div class="gui-widget">
      <gui-list
        ref="listRef"
        :id="uid"
        :uid="uid"
        :value="value ?? ''"
        :valueField="templateData.valueField"
        :items="templateData.items"
        :itemHeight="templateData.itemHeight"
        :height="templateData.height"
        :required="required"
        :touched="isTouched"
        :disabled="isDisabled"
        :readOnly="isReadOnly"
        @blur="handleBlur"
      >
        <div
          v-for="(item, idx) in visibleItems"
          :key="rangeStart + idx"
          role="option"
          tabindex="-1"
          :id="`${uid}-item-${rangeStart + idx}`"
          class="gui-list__item-wrapper"
          :style="{ height: `${templateData.itemHeight || 40}px` }"
          :aria-selected="value === item.value"
          :aria-disabled="isDisabled ? 'true' : 'false'"
          @click="handleClickItem(item, rangeStart + idx)"
        >
          <component
            :is="ItemRenderer"
            :template="
              (() => {
                const labelField = templateData.labelField ?? 'label';
                const isObject = item.template !== null && typeof item.template === 'object';
                return isObject && labelField && !templateData.itemRenderer
                  ? (item.template as any)[labelField]
                  : item.template;
              })()
            "
            :value="item.value"
            :index="idx"
            :selected="value === item.value"
            :disabled="isDisabled"
            :focused="focusedIndex === rangeStart + idx"
          />
        </div>
      </gui-list>
    </div>

    <gui-errors v-if="showErrors" :uid="uid" :errors="errors" :touched="isTouched"></gui-errors>
  </div>
</template>
