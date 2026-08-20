<script setup lang="ts">
import type { InputWidget, NonFunctionWidget, Validator, WithWidget } from '@golemui/core';
import { type RepeaterProps } from '@golemui/gui-shared/internals';
import { useInputWidget, WidgetRenderer } from '@golemui/vue';
import { computed, ref } from 'vue';
import '@golemui/gui-components/label';
import '@golemui/gui-components/errors';

const props = defineProps<WithWidget>();
const widget = props.widget as InputWidget<Record<string, unknown>[]>;
const { uid, value, onValueChanged, templateData, errors, isTouched, onBlur } = useInputWidget<
  Record<string, unknown>[],
  RepeaterProps<NonFunctionWidget<string>>
>(widget);

const required = computed(() => (templateData.value.validator as Validator)?.required);
const showErrors = computed(() => isTouched.value && errors.value && errors.value.length > 0);
const isFocused = ref(false);
const repeaterRef = ref<HTMLDivElement | null>(null);

const addItem = () => {
  onValueChanged([...(value.value ?? []), {}]);
};

const removeItem = (index: number) => {
  const items = (value.value ?? []).filter((_, i) => i !== index);
  // The store hands back data wrapped in Vue reactive proxies and structuredClone() throws
  // DataCloneError on those, so the JSON round-trip deep-clones and strips them instead.
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

      <div
        v-for="(row, index) in templateData.rows ?? []"
        :key="row.uid"
        class="gui-repeater__card"
      >
        <div class="gui-repeater__card-header">
          <span v-if="templateData.title" class="gui-repeater__card-title"
            >{{ templateData.title }} {{ index + 1 }}</span
          >
          <button
            type="button"
            tabindex="0"
            class="gui-button gui-button--sm gui-repeater__remove-btn"
            @click="removeItem(index)"
          >
            <span
              v-if="templateData.removeButtonIcon"
              :class="`gui-widget-icon gui-button-icon ${templateData.removeButtonIcon}`"
              :data-icon="templateData.removeButtonIcon"
            ></span>
            {{ templateData.removeLabel ?? 'Remove' }}
          </button>
        </div>
        <WidgetRenderer :widget="row" />
      </div>

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
