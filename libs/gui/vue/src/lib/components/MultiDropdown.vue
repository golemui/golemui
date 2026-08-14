<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useDebounceCallback, useInputWidget, useVueFormContext } from '@golemui/vue';
import type { ListItem, MultiDropdownProps, OptionValue } from '@golemui/gui-shared/internals';
import { computed, onMounted, onUnmounted, ref, watch, type Component } from 'vue';
import DefaultMultiListItemRenderer from './item-renderers/DefaultMultiListItemRenderer.vue';
import '@golemui/gui-components/label';
import '@golemui/gui-components/multi-list';
import '@golemui/gui-components/multi-select-trigger';
import '@golemui/gui-components/errors';

interface GuiMultiListElement extends HTMLElement {
  focusItemAtIndex(index: number): void;
  scrollToSelectedIndex(): void;
}
interface GuiMultiSelectTriggerElement extends HTMLElement {
  input: HTMLInputElement | null;
  focusInput(): void;
  closePillsDropdown(): void;
}
interface GuiLabelElement extends HTMLElement {
  targetElement?: HTMLElement | HTMLElement[];
}

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

const listRef = ref<GuiMultiListElement | null>(null);
const panelRef = ref<HTMLDivElement | null>(null);
const triggerRef = ref<GuiMultiSelectTriggerElement | null>(null);
const labelRef = ref<GuiLabelElement | null>(null);

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
  // The pills dropdown and the option panel share the space below the field;
  // only one may be open.
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
  if (templateData.value.limit !== undefined && current.length >= templateData.value.limit) return;
  onValueChanged([...current, val]);
};

const handleClickItem = (item: ListItem<any>, index: number) => {
  if (templateData.value.readonly || item.disabled) return;
  toggleValue(item.value);
  focusedIndex.value = index;
  // Multiselect: the panel stays open after a toggle and the filter text is
  // kept — flip here if that UX decision changes.
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
  // Multiselect: the panel stays open after a toggle — see handleClickItem.
};

let currentList: GuiMultiListElement | null = null;
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
  if (labelRef.value && triggerRef.value?.input && listRef.value) {
    labelRef.value.targetElement = [triggerRef.value.input, listRef.value];
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
  // Only the combobox input opens the panel — moving focus onto a pill must
  // not, so the pills dropdown can open instead.
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
  const toTrigger = triggerRef.value && triggerRef.value.contains(newFocus);
  const toList = listRef.value && listRef.value.contains(newFocus);
  const toPanel = panelRef.value && panelRef.value.contains(newFocus);
  if (toTrigger || toList || toPanel) return;
  closeList();
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

    <div class="gui-widget" @keydown="handleWidgetKeyDown">
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
        @focusout="handleFocusOut"
        @pillremove="handlePillRemove"
        @dropdowntoggle="handlePillsDropdownToggle"
      ></gui-multi-select-trigger>
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
