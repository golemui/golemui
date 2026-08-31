<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget, useVueFormContext } from '@golemui/vue';
import type { ListItem, MultiListProps, OptionValue } from '@golemui/gui-shared/internals';
import { computed, ref, watch, type Component } from 'vue';
import DefaultMultiListItemRenderer from './item-renderers/DefaultMultiListItemRenderer.vue';
import type { GuiLabel } from '@golemui/gui-components/label';
import type { GuiMultiList } from '@golemui/gui-components/multi-list';
import '@golemui/gui-components/label';
import '@golemui/gui-components/multi-list';
import '@golemui/gui-components/errors';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<OptionValue[]>;
const { uid, errors, value, isTouched, templateData, onValueChanged, onBlur } = useInputWidget<
  OptionValue[],
  MultiListProps<unknown>
>(widget);

const rangeStart = ref(0);
const rangeEnd = ref(10);
const listItems = ref<ListItem<any>[]>([]);
const focusedIndex = ref<number>(-1);
const listRef = ref<GuiMultiList | null>(null);
const labelRef = ref<GuiLabel | null>(null);

const currentValues = computed(() => (Array.isArray(value.value) ? value.value : []));

const visibleItems = computed(() => {
  const items = listItems.value.length > 0 ? listItems.value : templateData.value.items || [];
  return items.slice(rangeStart.value, rangeEnd.value);
});

const required = computed(() => (templateData.value.validator as Validator)?.required);
const isDisabled = computed(() => templateData.value.disabled as boolean);
const isReadOnly = computed(() => templateData.value.readonly as boolean);
const showErrors = computed(() => isTouched.value && errors.value && errors.value.length > 0);

const toggleValue = (val: OptionValue) => {
  if (templateData.value.disabled || templateData.value.readonly) return;

  const current = currentValues.value;
  if (current.includes(val)) {
    onValueChanged(current.filter((v) => v !== val));
    return;
  }
  onValueChanged([...current, val]);
};

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
  toggleValue((e as CustomEvent).detail.value);
};

watch(listRef, (el) => {
  if (labelRef.value) {
    labelRef.value.targetElement = el ?? undefined;
  }
});

const handleBlur = (e: FocusEvent) => {
  if (listRef.value && e.relatedTarget && listRef.value.contains(e.relatedTarget as Node)) return;
  onBlur();
};

const handleClickItem = (item: ListItem<any>, index: number) => {
  if (templateData.value.disabled || item.disabled) return;
  toggleValue(item.value);
  focusedIndex.value = index;
  listRef.value?.focusItemAtIndex(index);
};

const formContext = useVueFormContext();
const ItemRenderer = computed<Component>(() => {
  const renderers = formContext.itemRenderers as Record<string, Component>;
  return (
    renderers[templateData.value.itemRenderer as string] ||
    (DefaultMultiListItemRenderer as Component)
  );
});
</script>

<template>
  <div class="gui-multi-list-widget gui-field" :style="{ flex: templateData.size }">
    <gui-label
      ref="labelRef"
      :uid="uid"
      :label="templateData.label"
      :hint="templateData.hint"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :native="false"
    ></gui-label>

    <div class="gui-widget">
      <gui-multi-list
        ref="listRef"
        :id="uid"
        :uid="uid"
        :values="currentValues"
        :valueField="templateData.valueField"
        :items="templateData.items"
        :itemHeight="templateData.itemHeight"
        :height="templateData.height"
        :required="required"
        :touched="isTouched"
        :disabled="isDisabled"
        :readOnly="isReadOnly"
        @blur="handleBlur"
        @change="handleChange"
        @gui-update-items="handleUpdateItems"
        @gui-range-change="handleRangeChange"
        @gui-focus-change="handleFocusChange"
      >
        <div
          v-for="(item, idx) in visibleItems"
          :key="rangeStart + idx"
          role="option"
          tabindex="-1"
          :id="`${uid}-item-${rangeStart + idx}`"
          class="gui-list__item-wrapper"
          :style="{ height: `${templateData.itemHeight || 40}px` }"
          :aria-selected="currentValues.includes(item.value)"
          :aria-disabled="isDisabled || item.disabled ? 'true' : 'false'"
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
            :selected="currentValues.includes(item.value)"
            :disabled="isDisabled || !!item.disabled"
            :focused="focusedIndex === rangeStart + idx"
          />
        </div>
      </gui-multi-list>
    </div>

    <gui-errors v-if="showErrors" :uid="uid" :errors="errors" :touched="isTouched"></gui-errors>
  </div>
</template>
