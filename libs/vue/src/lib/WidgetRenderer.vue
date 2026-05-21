<script setup lang="ts">
import {
  type NonFunctionWidget,
  cloneObject,
  errorCodes,
  makeRepeaterItemConfig,
} from '@golemui/core';
import { computed, onMounted, onUnmounted, provide, ref, shallowRef, type Component } from 'vue';
import WidgetErrorBoundary from './WidgetErrorBoundary.vue';
import { useVueFormContext } from './provideFormContext';
import { repeaterIndexesInjectionKey, useRepeaterIndexes } from './repeaterIndexes';

const props = defineProps<{
  widget: NonFunctionWidget<string>;
  repeaterIndex?: number;
}>();

const formContext = useVueFormContext();
const LoadedComponent = shallowRef<Component | null>(null);
const resolvedWidget = ref<NonFunctionWidget<string>>(props.widget);
const isMounted = ref(true);

const parentRepeaterIndexes = useRepeaterIndexes();
const repeaterIndexes = computed(() =>
  props.repeaterIndex === undefined
    ? parentRepeaterIndexes
    : [...parentRepeaterIndexes, props.repeaterIndex],
);
provide(repeaterIndexesInjectionKey, repeaterIndexes.value);

onMounted(async () => {
  try {
    const loaded = await formContext.widgetRegistry.loadWidget(props.widget.type);
    if (!isMounted.value) return;
    if (repeaterIndexes.value.length > 0) {
      resolvedWidget.value = makeRepeaterItemConfig(
        cloneObject(props.widget),
        repeaterIndexes.value,
      );
    }
    LoadedComponent.value = loaded;
  } catch {
    const code = errorCodes.widgetCouldNotBeLoaded;
    formContext.store.dispatch({
      type: 'SET_FORM_HEALTH',
      payload: {
        formHealth: {
          status: 'errored',
          message: `[${code}] Widget "${props.widget.type}" could not be loaded`,
          code,
        },
      },
    });
  }
});

onUnmounted(() => {
  isMounted.value = false;
});
</script>

<template>
  <WidgetErrorBoundary v-if="LoadedComponent" :widget="resolvedWidget">
    <component :is="LoadedComponent" :widget="resolvedWidget" />
  </WidgetErrorBoundary>
</template>
