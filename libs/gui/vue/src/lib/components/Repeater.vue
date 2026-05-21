<script setup lang="ts">
import type { InputWidget, Validator, WithWidget } from '@golemui/core';
import type { RepeaterProps } from '@golemui/gui-shared';
import { getItemKey } from '@golemui/gui-shared/internals';
import { useInputWidget, useRepeaterIndexes } from '@golemui/vue';
import { computed, ref } from 'vue';
import RepeaterItem from './shared/RepeaterItem.vue';
import '@golemui/gui-components/label';
import '@golemui/gui-components/errors';

let nextRepeaterItemId = 0;
const idIncrementer = () => nextRepeaterItemId++;

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<Record<string, unknown>[]>;
const { uid, value, onValueChanged, templateData, errors, isTouched, onBlur } = useInputWidget<
  Record<string, unknown>[],
  RepeaterProps<any>
>(widget);

const required = computed(() => (templateData.value.validator as Validator)?.required);
const showErrors = computed(() => isTouched.value && errors.value && errors.value.length > 0);
const isFocused = ref(false);
const repeaterRef = ref<HTMLDivElement | null>(null);
const parentIndexes = useRepeaterIndexes();

const addItem = () => {
  onValueChanged([...(value.value ?? []), {}]);
};

const removeItem = (index: number) => {
  const items = (value.value ?? []).filter((_, i) => i !== index);
  // The form store hands back data wrapped in Vue reactive proxies, and
  // structuredClone() throws DataCloneError on Proxies. JSON round-trip both
  // deep-clones AND transparently strips the proxies via the getter chain.
  onValueChanged(JSON.parse(JSON.stringify(items)));
};

const onFocusIn = (event: FocusEvent) => {
  event.stopPropagation();
  isFocused.value = true;
};
const onFocusOut = (event: FocusEvent) => {
  event.stopPropagation();
  onBlur();
  isFocused.value = false;
};

const cardClass = computed(() => {
  let cls = 'gui-repeater__main-card gui-repeater__card';
  if (isFocused.value) cls += ' gui-repeater__card--focused';
  return cls;
});

const isLimitReached = computed(() =>
  templateData.value.limit ? templateData.value.limit === (value.value?.length ?? 0) : false,
);

const items = computed(() =>
  (value.value ?? []).map((item, index) => ({
    item,
    index,
    key: `${uid.value}-${getItemKey(item, idIncrementer)}`,
    indexes: [...parentIndexes, index],
  })),
);
</script>

<template>
  <div class="gui-repeater gui-field" :style="{ flex: templateData.size }">
    <div ref="repeaterRef" :id="uid" :class="cardClass" @focusin="onFocusIn" @focusout="onFocusOut">
      <gui-label
        :targetElement="repeaterRef ?? undefined"
        :uid="uid"
        :label="templateData.label"
        :errors="errors"
        :touched="isTouched"
        :required="required"
        :native="false"
      ></gui-label>

      <RepeaterItem
        v-for="entry in items"
        :key="entry.key"
        :index="entry.index"
        :indexes="entry.indexes"
        :title="templateData.title"
        :remove-button-icon="templateData.removeButtonIcon"
        :remove-label="templateData.removeLabel"
        :template="templateData.template"
        @remove="removeItem(entry.index)"
      />

      <button
        type="button"
        tabindex="0"
        class="gui-button gui-repeater__add-btn"
        :disabled="isLimitReached"
        @click="addItem"
      >
        <span
          v-if="templateData.addButtonIcon"
          :class="`gui-widget-icon gui-button-icon ${templateData.addButtonIcon}`"
          :data-icon="templateData.addButtonIcon"
        ></span>
        {{ templateData.addLabel ?? 'Add' }}
      </button>
    </div>

    <gui-errors v-if="showErrors" :uid="uid" :errors="errors" :touched="isTouched"></gui-errors>
  </div>
</template>
