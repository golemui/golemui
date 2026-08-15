<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useDebounceCallback, useInputWidget, useVueFormContext } from '@golemui/vue';
import type { ListItem, MultiDropdownProps, OptionValue } from '@golemui/gui-shared/internals';
import { computed, onMounted, onUnmounted, ref, watch, type Component } from 'vue';
import DefaultMultiListItemRenderer from './item-renderers/DefaultMultiListItemRenderer.vue';
import type { GuiLabel } from '@golemui/gui-components/label';
import type { GuiMultiList } from '@golemui/gui-components/multi-list';
import type { GuiMultiSelectTrigger } from '@golemui/gui-components/multi-select-trigger';
import '@golemui/gui-components/label';
import '@golemui/gui-components/multi-list';
import '@golemui/gui-components/multi-select-trigger';
import '@golemui/gui-components/errors';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<OptionValue[]>;
const { uid, errors, value, isTouched, templateData, onFilter, onValueChanged, onBlur } =
  useInputWidget<OptionValue[], MultiDropdownProps<any>>(widget);

const rangeStart = ref(0);
const rangeEnd = ref(10);
const listItems = ref<ListItem<any>[]>([]);
const filteredItems = ref<ListItem<any>[]>([]);
const focusedIndex = ref<number>(-1);
const isFiltering = ref(false);
const isListVisible = ref(false);

const listRef = ref<GuiMultiList | null>(null);
const panelRef = ref<HTMLDivElement | null>(null);
const triggerRef = ref<GuiMultiSelectTrigger | null>(null);
const labelRef = ref<GuiLabel | null>(null);
const widgetRef = ref<HTMLDivElement | null>(null);

const currentValues = computed(() => (Array.isArray(value.value) ? value.value : []));

const visibleItems = computed(() => listItems.value.slice(rangeStart.value, rangeEnd.value));

const pillItems = computed(() => {
  const labelField = (templateData.value.labelField as string) ?? 'label';
  return currentValues.value.map((val) => {
    const item = listItems.value.find((i) => i.value === val);
    const isObject = item != null && item.template !== null && typeof item.template === 'object';
    const label =
      item == null
        ? String(val)
        : isObject
          ? String((item.template as any)[labelField])
          : String(item.template);
    return { key: String(val), label };
  });
});

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

const openPanel = () => {
  triggerRef.value?.closePillsDropdown();
  isListVisible.value = true;
  setTimeout(() => listRef.value?.scrollToSelectedIndex(), 0);
};

const toggleValue = (val: OptionValue) => {
  if (templateData.value.disabled || templateData.value.readonly) return;

  const current = currentValues.value;
  if (current.includes(val)) {
    onValueChanged(current.filter((v) => v !== val));
    return;
  }
  onValueChanged([...current, val]);
};

const handleClickItem = (item: ListItem<any>, index: number) => {
  if (templateData.value.readonly || item.disabled) return;
  toggleValue(item.value);
  focusedIndex.value = index;
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
};

const handleFocusChange = (e: Event) => {
  focusedIndex.value = (e as CustomEvent).detail.index;
};

const handleListChange = (e: Event) => {
  toggleValue((e as CustomEvent).detail.value);
};

let currentList: GuiMultiList | null = null;
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
  const clickedTrigger = triggerRef.value && triggerRef.value.contains(target);
  const clickedPanel = panelRef.value && panelRef.value.contains(target);
  if (!clickedTrigger && !clickedPanel) closeList();
};

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

watch(listRef, (el) => {
  if (!labelRef.value) return;
  const targets = [triggerRef.value?.input, el].filter(Boolean) as HTMLElement[];
  if (targets.length) {
    labelRef.value.targetElement = targets;
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
  currentList?.removeEventListener('gui-range-change', handleRangeChange);
  currentList?.removeEventListener('gui-update-items', handleUpdateItems);
  currentList?.removeEventListener('gui-focus-change', handleFocusChange);
  currentList?.removeEventListener('change', handleListChange);
});

const handleTriggerKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    openPanel();
    setTimeout(() => listRef.value?.focus(), 0);
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

let ignoreNextFocus = false;
const handleFocusIn = (e: FocusEvent) => {
  if (ignoreNextFocus) return;
  if (isListVisible.value) return;
  if (e.target !== triggerRef.value?.input) return;
  openPanel();
};

const handleWidgetKeyDown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !isListVisible.value) return;
  event.preventDefault();
  event.stopPropagation();
  isListVisible.value = false;
  isFiltering.value = false;
  ignoreNextFocus = true;
  triggerRef.value?.focusInput();
  setTimeout(() => {
    ignoreNextFocus = false;
  });
};

const handleFocusOut = (e: FocusEvent) => {
  const newFocus = e.relatedTarget as Node;
  if (newFocus && widgetRef.value?.contains(newFocus)) return;
  closeList();
};

const handleToggleMouseDown = (event: MouseEvent) => {
  event.preventDefault();
};

const handleToggleClick = (event: MouseEvent) => {
  event.stopPropagation();
  if (isListVisible.value) {
    isListVisible.value = false;
    isFiltering.value = false;
    ignoreNextFocus = true;
    triggerRef.value?.focusInput();
    setTimeout(() => {
      ignoreNextFocus = false;
    });
  } else {
    triggerRef.value?.focusInput();
    openPanel();
  }
};

const handlePillRemove = (e: Event) => {
  const key = (e as CustomEvent).detail?.key;
  const val = currentValues.value.find((v) => String(v) === key);
  if (val === undefined) return;
  toggleValue(val);
};

const handlePillsDropdownToggle = (e: Event) => {
  if ((e as CustomEvent).detail?.open && isListVisible.value) {
    isListVisible.value = false;
  }
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
  <div class="gui-multi-dropdown gui-field" :style="{ flex: templateData.size }">
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

    <div
      ref="widgetRef"
      class="gui-widget"
      @keydown="handleWidgetKeyDown"
      @focusout="handleFocusOut"
    >
      <gui-multi-select-trigger
        ref="triggerRef"
        :uid="uid"
        :pills="pillItems"
        :errors="errors"
        :touched="isTouched"
        :required="required"
        :disabled="isDisabled"
        :readOnly="isReadOnly"
        :placeholder="templateData.placeholder ?? ''"
        :icon="templateData.icon"
        :autocomplete="templateData.autocomplete"
        :hasLabel="!!templateData.label"
        :hasHint="!!templateData.hint"
        :panelOpen="isListVisible"
        :panelId="`${uid}-list`"
        :removeAriaLabel="templateData.removeAriaLabel"
        :removeIcon="templateData.removeIcon"
        :compactAriaLabel="`${pillItems.length} selected`"
        @keydown="handleTriggerKeyDown"
        @input="handleInputFilter"
        @focusin="handleFocusIn"
        @pillremove="handlePillRemove"
        @dropdowntoggle="handlePillsDropdownToggle"
      ></gui-multi-select-trigger>
      <button
        type="button"
        class="gui-dropdown__arrow"
        :aria-label="templateData.toggleAriaLabel ?? 'Show options'"
        aria-haspopup="listbox"
        :aria-expanded="isListVisible ? 'true' : 'false'"
        :aria-controls="`${uid}-list`"
        :disabled="isDisabled"
        @mousedown="handleToggleMouseDown"
        @click="handleToggleClick"
      >
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
      </button>

      <div
        class="gui-picker__panel"
        :hidden="!isListVisible"
        ref="panelRef"
        @mousedown="handlePanelMouseDown"
      >
        <gui-multi-list
          ref="listRef"
          :id="`${uid}-list`"
          :uid="uid"
          :values="currentValues"
          :valueField="templateData.valueField"
          :items="isFiltering && !asyncFiltering ? filteredItems : templateData.items"
          :itemHeight="templateData.itemHeight"
          :height="templateData.height"
          :required="required"
          :touched="isTouched"
          :disabled="isDisabled || isReadOnly"
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
              :index="rangeStart + idx"
              :selected="currentValues.includes(item.value)"
              :disabled="isDisabled || isReadOnly || !!item.disabled"
              :focused="focusedIndex === rangeStart + idx"
            />
          </div>
        </gui-multi-list>
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
