<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useDebounceCallback, useInputWidget, useVueFormContext } from '@golemui/vue';
import type { DropdownProps, ListItem, OptionValue } from '@golemui/gui-shared/internals';
import { computed, onMounted, onUnmounted, ref, watch, type Component } from 'vue';
import DefaultListItemRenderer from './item-renderers/DefaultListItemRenderer.vue';
import '@golemui/gui-components/label';
import '@golemui/gui-components/list';
import '@golemui/gui-components/errors';

interface GuiListElement extends HTMLElement {
  focusItemAtIndex(index: number): void;
  scrollToSelectedIndex(): void;
}
interface GuiLabelElement extends HTMLElement {
  targetElement?: HTMLElement | HTMLElement[];
}

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<string | null>;
const { uid, errors, value, isTouched, templateData, onFilter, onValueChanged, onBlur } =
  useInputWidget<string | number | null, DropdownProps<never>>(widget);

const rangeStart = ref(0);
const rangeEnd = ref(10);
const listItems = ref<ListItem<never>[]>([]);
const filteredItems = ref<ListItem<never>[]>([]);
const focusedIndex = ref<number>(-1);
const isFiltering = ref(false);
const isListVisible = ref(false);
const selectedItem = ref<ListItem<never> | undefined>(undefined);

const listRef = ref<GuiListElement | null>(null);
const panelRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const labelRef = ref<GuiLabelElement | null>(null);

const visibleItems = computed(() => listItems.value.slice(rangeStart.value, rangeEnd.value));

const required = computed(() => (templateData.value.validator as Validator)?.required);
const isDisabled = computed(() => templateData.value.disabled as boolean);
const isReadOnly = computed(() => templateData.value.readonly as boolean);
const asyncFiltering = computed(() => !!widget.on?.filter);
const showErrors = computed(() => isTouched.value && errors.value && errors.value.length > 0);

const closeList = () => {
  onBlur();
  isListVisible.value = false;
  isFiltering.value = false;
};

const handleValueChange = (newValue: OptionValue | null) => {
  onValueChanged(newValue);
  if (inputRef.value) {
    const items = templateData.value.items || [];
    const match = items.find((item: any) =>
      templateData.value.valueField
        ? item[templateData.value.valueField] === newValue
        : item === newValue,
    );
    if (match) {
      const displayValue = templateData.value.valueField
        ? (match as any)[templateData.value.valueField]
        : match;
      inputRef.value.value = String(displayValue);
    } else if (!newValue) {
      inputRef.value.value = '';
    }
  }
  isListVisible.value = false;
  isFiltering.value = false;
};

const handleClickItem = (item: ListItem<never>, index: number) => {
  if (templateData.value.readonly || item.disabled) return;
  handleValueChange(item.value);
  onFilter('' as never);
  focusedIndex.value = index;
  selectedItem.value = item;
  isFiltering.value = false;
  isListVisible.value = false;
  listRef.value?.focusItemAtIndex(index);
};

const handleRangeChange = (e: Event) => {
  const { startIndex, endIndex } = (e as CustomEvent).detail;
  rangeStart.value = startIndex;
  rangeEnd.value = endIndex;
};

const handleUpdateItems = (e: Event) => {
  const items = (e as CustomEvent).detail;
  listItems.value = items ? [...items] : [];
  if (!selectedItem.value && value.value != null && items) {
    const match = items.find((item: ListItem<never>) => item.value === value.value);
    if (match) selectedItem.value = match;
  }
};

const handleFocusChange = (e: Event) => {
  focusedIndex.value = (e as CustomEvent).detail.index;
};

const handleListChange = (e: Event) => {
  const val = (e as CustomEvent).detail.value;
  handleValueChange(val);
  selectedItem.value = listItems.value.find((item) => item.value === val);
  isFiltering.value = false;
  isListVisible.value = false;
};

let currentList: GuiListElement | null = null;
watch(listRef, (el) => {
  if (currentList) {
    currentList.removeEventListener('gui-range-change', handleRangeChange);
    currentList.removeEventListener('gui-update-items', handleUpdateItems);
    currentList.removeEventListener('gui-focus-change', handleFocusChange);
    currentList.removeEventListener('change', handleListChange);
  }
  currentList = el;
  if (el) {
    el.addEventListener('gui-range-change', handleRangeChange);
    el.addEventListener('gui-update-items', handleUpdateItems);
    el.addEventListener('gui-focus-change', handleFocusChange);
    el.addEventListener('change', handleListChange);
  }
});

const handlePanelMouseDown = (event: MouseEvent) => {
  const target = event.target as Node;
  if (listRef.value && listRef.value.contains(target)) return;
  event.preventDefault();
};

const handleDocumentClick = (event: MouseEvent) => {
  if (!isListVisible.value) return;
  const target = event.target as Node;
  const clickedInput = inputRef.value && inputRef.value.contains(target);
  const clickedPanel = panelRef.value && panelRef.value.contains(target);
  if (!clickedInput && !clickedPanel) closeList();
};

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  if (labelRef.value && inputRef.value && listRef.value) {
    labelRef.value.targetElement = [inputRef.value, listRef.value];
  }
  if (inputRef.value) {
    inputRef.value.value = String(value.value ?? '');
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
  currentList?.removeEventListener('gui-range-change', handleRangeChange);
  currentList?.removeEventListener('gui-update-items', handleUpdateItems);
  currentList?.removeEventListener('gui-focus-change', handleFocusChange);
  currentList?.removeEventListener('change', handleListChange);
});

watch([selectedItem, () => templateData.value.labelField], () => {
  const item = selectedItem.value;
  const isObject = item?.template !== null && typeof item?.template === 'object';
  const referenceField = isObject ? (templateData.value.labelField ?? 'label') : null;
  const val = referenceField ? (item?.template as any)[referenceField] : item?.template;
  if (inputRef.value) inputRef.value.value = (val ?? '') as string;
});

const handleInputKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      isListVisible.value = true;
      setTimeout(() => {
        listRef.value?.focus();
        listRef.value?.scrollToSelectedIndex();
      }, 0);
      break;
    case 'Enter':
      if (!inputRef.value?.value) handleValueChange(null);
      break;
  }
};

const filterItems = (filterValue: string) => {
  const async = !!widget.on?.filter;
  onFilter(filterValue as never);

  if (filterValue && !async) {
    isFiltering.value = true;
    isListVisible.value = true;

    const searchFields =
      templateData.value.searchFields ??
      ([templateData.value.labelField!, templateData.value.valueField!].filter(
        (f) => !!f,
      ) as string[]);
    const hasSearchFields = searchFields.length > 0;
    const items = templateData.value.items || [];
    const filtered = items.filter((item: any) => {
      const isPrimitive = item === null || typeof item !== 'object';

      if (isPrimitive) {
        return item != null && item.toString().toLowerCase().includes(filterValue.toLowerCase());
      }

      const keys = Object.keys(item);
      const reduceFn = (acc: boolean, prop: string) =>
        acc || item[prop].toString().toLowerCase().includes(filterValue.toLowerCase());

      return hasSearchFields
        ? keys.filter((p: string) => searchFields.includes(p)).reduce(reduceFn, false)
        : keys.reduce(reduceFn, false);
    });
    filteredItems.value = filtered;
  } else {
    isFiltering.value = false;
    filteredItems.value = [...(templateData.value.items || [])];
  }
};

const debouncedFilter = useDebounceCallback(filterItems, templateData.value.inputDebounce ?? 500);

const handleInputFilter = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!isListVisible.value) isListVisible.value = true;
  debouncedFilter(target.value);
};

const handleInputFocus = () => {
  if (ignoreNextFocus) return;
  if (isListVisible.value) return;
  isListVisible.value = true;
  setTimeout(() => listRef.value?.scrollToSelectedIndex(), 0);
};

let ignoreNextFocus = false;
const handleWidgetKeyDown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !isListVisible.value) return;
  event.preventDefault();
  event.stopPropagation();
  isListVisible.value = false;
  isFiltering.value = false;
  ignoreNextFocus = true;
  inputRef.value?.focus();
  setTimeout(() => {
    ignoreNextFocus = false;
  });
};

const handleFocusOut = (e: FocusEvent) => {
  const newFocus = e.relatedTarget as Node;
  const toInput = inputRef.value && inputRef.value.contains(newFocus);
  const toList = listRef.value && listRef.value.contains(newFocus);
  if (toInput || toList) return;
  closeList();
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
  <div class="gui-dropdown gui-field" :style="{ flex: templateData.size }">
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

    <div class="gui-widget" @keydown="handleWidgetKeyDown">
      <input
        ref="inputRef"
        type="text"
        role="combobox"
        :id="uid"
        :data-cy="`${uid}_textinput`"
        class="gui-widget-input"
        :required="required"
        :disabled="isDisabled"
        :readonly="isReadOnly"
        :placeholder="templateData.placeholder ?? ''"
        :autocomplete="templateData.autocomplete ?? undefined"
        :aria-expanded="isListVisible ? 'true' : 'false'"
        :aria-controls="`${uid}-list`"
        aria-autocomplete="list"
        :aria-labelledby="templateData.label ? `${uid}_label` : undefined"
        :aria-describedby="templateData.hint ? `${uid}_hint` : undefined"
        @keydown="handleInputKeyDown"
        @input="handleInputFilter"
        @focus="handleInputFocus"
        @blur="handleFocusOut"
      />
      <span class="gui-dropdown__arrow">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 256 256"
          aria-hidden="true"
        >
          <path
            d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
          ></path>
        </svg>
      </span>

      <div
        class="gui-picker__panel"
        :hidden="!isListVisible"
        ref="panelRef"
        @mousedown="handlePanelMouseDown"
      >
        <gui-list
          ref="listRef"
          :id="`${uid}-list`"
          :uid="uid"
          :value="value ?? ''"
          :valueField="templateData.valueField"
          :items="isFiltering && !asyncFiltering ? filteredItems : templateData.items"
          :itemHeight="templateData.itemHeight"
          :height="templateData.height"
          :required="required"
          :touched="isTouched"
          :disabled="isDisabled || isReadOnly"
          :readOnly="isReadOnly"
          :hidden="!isListVisible"
          @focus="handleInputFocus"
          @blur="handleFocusOut"
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
              :index="rangeStart + idx"
              :selected="value === item.value"
              :disabled="isDisabled || isReadOnly || !!item.disabled"
              :focused="focusedIndex === rangeStart + idx"
            />
          </div>
        </gui-list>
        <gui-errors
          v-if="showErrors"
          :panel.prop="true"
          :uid="uid"
          :errors="errors"
          :touched="isTouched"
        ></gui-errors>
      </div>
    </div>

    <gui-errors v-if="showErrors" :uid="uid" :errors="errors" :touched="isTouched"></gui-errors>
  </div>
</template>
