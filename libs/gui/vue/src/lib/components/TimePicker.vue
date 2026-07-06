<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget, useVueFormContext } from '@golemui/vue';
import {
  buildTimeOptions,
  formatISOTimeForLocale,
  resolveHourFormat,
} from '@golemui/gui-components/internals';
import type { ListItem, TimePickerProps } from '@golemui/gui-shared/internals';
import { computed, onMounted, onUnmounted, ref, watch, type Component } from 'vue';
import Errors from './shared/Errors.vue';
import DefaultListItemRenderer from './item-renderers/DefaultListItemRenderer.vue';
import '@golemui/gui-components/time-input';
import '@golemui/gui-components/list';

interface GuiListElement extends HTMLElement {
  focusItemAtIndex(index: number): void;
  scrollToSelectedIndex(): void;
}

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<string>;
const {
  uid,
  errors,
  value,
  isTouched,
  templateData,
  onValueChanged,
  onBlur,
  injectValidationIssues,
} = useInputWidget<string, TimePickerProps>(widget);

const required = computed(() => (templateData.value.validator as Validator)?.required);
const isDisabled = computed(() => templateData.value.disabled as boolean);
const isReadOnly = computed(() => templateData.value.readonly as boolean);
const showErrors = computed(() => isTouched.value && errors.value && errors.value.length > 0);

const isListVisible = ref(false);
const rangeStart = ref(0);
const rangeEnd = ref(10);
const focusedIndex = ref<number>(-1);

const containerRef = ref<HTMLDivElement | null>(null);
const timeControlRef = ref<HTMLElement | null>(null);
const listRef = ref<GuiListElement | null>(null);

const hourFormat = computed(() =>
  resolveHourFormat(templateData.value.lang, templateData.value.hourFormat),
);

/** Selectable slots with locale display labels, disabled inside disabledRanges. */
const timeItems = computed<ListItem<string>[]>(() =>
  buildTimeOptions(templateData.value).map((slot) => ({
    template: formatISOTimeForLocale(slot.value, templateData.value.lang, hourFormat.value),
    value: slot.value,
    disabled: slot.disabled,
  })),
);

const visibleItems = computed(() => timeItems.value.slice(rangeStart.value, rangeEnd.value));

const formContext = useVueFormContext();
const ItemRenderer = computed<Component>(() => {
  const renderers = formContext.itemRenderers as Record<string, Component>;
  return (
    renderers[templateData.value.itemRenderer as string] || (DefaultListItemRenderer as Component)
  );
});

const openList = () => {
  isListVisible.value = true;
  requestAnimationFrame(() => listRef.value?.scrollToSelectedIndex());
};

const selectValue = (newValue: string) => {
  injectValidationIssues(null);
  onValueChanged(newValue);
  isListVisible.value = false;
};

const handleClickItem = (item: ListItem<string>, index: number) => {
  if (isReadOnly.value || item.disabled) return;

  selectValue(item.value as string);
  focusedIndex.value = index;
};

const timeChange = (e: Event) => {
  injectValidationIssues(null);
  onValueChanged((e as CustomEvent).detail.value);
};
const timeError = (e: Event) => {
  injectValidationIssues([(e as CustomEvent).detail.message]);
};
let currentTime: HTMLElement | null = null;
watch(timeControlRef, (el) => {
  if (currentTime) {
    currentTime.removeEventListener('change', timeChange);
    currentTime.removeEventListener('focus', openList);
    currentTime.removeEventListener('blur', onBlur);
    currentTime.removeEventListener('inputError', timeError);
  }
  currentTime = el;
  if (el) {
    el.addEventListener('change', timeChange);
    el.addEventListener('focus', openList);
    el.addEventListener('blur', onBlur);
    el.addEventListener('inputError', timeError);
  }
});

const handleRangeChange = (e: Event) => {
  const { startIndex, endIndex } = (e as CustomEvent).detail;
  rangeStart.value = startIndex;
  rangeEnd.value = endIndex;
};
const handleFocusChange = (e: Event) => {
  focusedIndex.value = (e as CustomEvent).detail.index;
};
// Enter/Space selection inside the list commits a single time, so close
const handleListChange = (e: Event) => {
  selectValue((e as CustomEvent).detail.value);
};
let currentList: GuiListElement | null = null;
watch(listRef, (el) => {
  if (currentList) {
    currentList.removeEventListener('gui-range-change', handleRangeChange);
    currentList.removeEventListener('gui-focus-change', handleFocusChange);
    currentList.removeEventListener('change', handleListChange);
  }
  currentList = el;
  if (el) {
    el.addEventListener('gui-range-change', handleRangeChange);
    el.addEventListener('gui-focus-change', handleFocusChange);
    el.addEventListener('change', handleListChange);
  }
});

const onDocumentClick = (event: MouseEvent) => {
  if (!isListVisible.value) return;
  const path = event.composedPath();
  const inTime = timeControlRef.value && path.includes(timeControlRef.value);
  const inList = listRef.value && path.includes(listRef.value);
  if (!inTime && !inList) isListVisible.value = false;
};

onMounted(() => document.addEventListener('click', onDocumentClick));
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
  currentTime?.removeEventListener('change', timeChange);
  currentTime?.removeEventListener('focus', openList);
  currentTime?.removeEventListener('blur', onBlur);
  currentTime?.removeEventListener('inputError', timeError);
  currentList?.removeEventListener('gui-range-change', handleRangeChange);
  currentList?.removeEventListener('gui-focus-change', handleFocusChange);
  currentList?.removeEventListener('change', handleListChange);
});

const onFocusOut = (event: FocusEvent) => {
  if (!isListVisible.value) return;
  const newFocus = event.relatedTarget as Node;
  if (newFocus && containerRef.value?.contains(newFocus)) return;
  isListVisible.value = false;
};

const toggleList = (event: MouseEvent) => {
  const target = event.target as HTMLElement;

  if (target.closest('.gui-list__item-wrapper')) return;

  const isInputClick = target.closest('.gui-time-input__part');
  const isListClick = target.closest('gui-list');
  if (isInputClick || isListClick) {
    if (!isListVisible.value) openList();
  } else {
    isListVisible.value = !isListVisible.value;
  }
};

const onKeyUp = (event: KeyboardEvent) => {
  if (event.target !== event.currentTarget) return;
  if (event.key === 'Enter' || event.key === ' ') {
    isListVisible.value = !isListVisible.value;
  }
};

/**
 * Select-like keyboard behavior when custom time entry is off: ArrowDown/
 * ArrowUp move the value to the next/previous enabled option (the first or
 * last one when nothing is selected yet).
 */
const onKeyDown = (event: KeyboardEvent) => {
  if (templateData.value.allowCustomTime || isReadOnly.value || isDisabled.value) return;
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

  const target = event.target as HTMLElement;
  if (!target.closest('gui-time')) return;

  event.preventDefault();
  const items = timeItems.value;
  const direction = event.key === 'ArrowDown' ? 1 : -1;
  const currentIndex = items.findIndex((item) => item.value === value.value);
  let index =
    currentIndex === -1 ? (direction === 1 ? 0 : items.length - 1) : currentIndex + direction;
  while (index >= 0 && index < items.length && items[index].disabled) {
    index += direction;
  }
  if (index < 0 || index >= items.length) return;

  injectValidationIssues(null);
  onValueChanged(items[index].value as string);
  focusedIndex.value = index;
  openList();
};
</script>

<template>
  <div
    ref="containerRef"
    class="gui-time-picker gui-field"
    :style="{ flex: templateData.size }"
    @focusout="onFocusOut"
  >
    <label v-if="templateData.label" class="gui-label" :for="uid" :data-cy="`${uid}_label`">
      {{ templateData.label }}{{ required ? ' *' : '' }}
      <div v-if="templateData.hint" class="gui-widget-hint" :id="`${uid}_hint`">
        {{ templateData.hint }}
      </div>
    </label>
    <div
      role="button"
      tabindex="-1"
      class="gui-widget"
      :aria-expanded="isListVisible"
      @click="toggleList"
      @keyup="onKeyUp"
      @keydown="onKeyDown"
    >
      <gui-time
        ref="timeControlRef"
        :uid="uid"
        :hint="templateData.hint"
        :showErrors="false"
        :errors="errors"
        :touched="isTouched"
        :required="required"
        :disabled="isDisabled"
        :readOnly="isReadOnly || !templateData.allowCustomTime"
        :value="value"
        :icon="templateData.icon"
        :localeId="templateData.lang"
        :hourFormat="templateData.hourFormat"
        :minuteStep="templateData.minuteStep ?? 1"
        :minTime="templateData.minTime"
        :maxTime="templateData.maxTime"
        :disabledRanges="templateData.disabledRanges"
      />
      <span class="gui-time-picker__arrow">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
          <path
            d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
          ></path>
        </svg>
      </span>

      <gui-list
        ref="listRef"
        :id="`${uid}-list`"
        :uid="uid"
        :value="value ?? ''"
        :items.prop="timeItems"
        :itemHeight="templateData.itemHeight"
        :height="templateData.height"
        :required="required"
        :touched="isTouched"
        :disabled="isDisabled"
        :readOnly="isReadOnly"
        :hidden="!isListVisible"
      >
        <div
          v-for="(item, idx) in visibleItems"
          :key="rangeStart + idx"
          role="option"
          tabindex="-1"
          class="gui-list__item-wrapper"
          :id="`${uid}-item-${rangeStart + idx}`"
          :style="{ height: `${templateData.itemHeight || 40}px` }"
          :aria-selected="value === item.value"
          :aria-disabled="isDisabled || item.disabled ? 'true' : 'false'"
          @click="handleClickItem(item, rangeStart + idx)"
        >
          <component
            :is="ItemRenderer"
            :template="item.template"
            :value="item.value"
            :index="rangeStart + idx"
            :selected="value === item.value"
            :disabled="isDisabled || !!item.disabled"
            :focused="focusedIndex === rangeStart + idx"
          />
        </div>
      </gui-list>
    </div>
    <Errors v-if="showErrors" :errors="errors" :uid="uid" />
  </div>
</template>
