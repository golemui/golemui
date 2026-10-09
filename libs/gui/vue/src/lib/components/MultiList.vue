<script setup lang="ts">
import type { GuiVisibleItem } from '@golemui/gui-components';
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import { useInputWidget, useVueFormContext } from '@golemui/vue';
import type { MultiListProps, OptionValue } from '@golemui/gui-shared/internals';
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

// The options to render, as the list reports them.
const visibleItems = ref<GuiVisibleItem<any>[]>([]);
const listRef = ref<GuiMultiList | null>(null);
const labelRef = ref<GuiLabel | null>(null);

const currentValues = computed(() => (Array.isArray(value.value) ? value.value : []));

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

const handleVisibleItemsChange = (e: Event) => {
  visibleItems.value = (e as CustomEvent<GuiVisibleItem<any>[]>).detail;
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
  <div class="gui-multi-list-widget gui-field">
    <gui-label
      ref="labelRef"
      :uid="uid"
      :label="templateData.label"
      :hint="templateData.hint"
      :errors="errors"
      :touched="isTouched"
      :required="required"
      :disabled="isDisabled"
      :readOnly="isReadOnly"
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
        @gui-blur="handleBlur"
        @gui-item-toggle="handleChange"
        @gui-visible-items-change="handleVisibleItemsChange"
      >
        <div
          v-for="item in visibleItems"
          :key="item.index"
          role="option"
          tabindex="-1"
          :id="item.id"
          class="gui-list__item-wrapper"
          :style="{ height: `${templateData.itemHeight || 40}px` }"
          :aria-selected="item.selected"
          :aria-disabled="item.disabled ? 'true' : 'false'"
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
            :index="item.index"
            :selected="item.selected"
            :disabled="item.disabled"
            :focused="item.focused"
          />
        </div>
      </gui-multi-list>
    </div>

    <gui-errors v-if="showErrors" :uid="uid" :errors="errors" :touched="isTouched"></gui-errors>
  </div>
</template>
