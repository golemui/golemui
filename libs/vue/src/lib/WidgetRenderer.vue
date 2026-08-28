<script setup lang="ts">
import { type NonFunctionWidget, errorCodes } from '@golemui/core';
import { onMounted, onUnmounted, ref, shallowRef, type Component } from 'vue';
import WidgetErrorBoundary from './WidgetErrorBoundary.vue';
import { useVueFormContext } from './provideFormContext';

// Repeater rows arrive from the store with their indexes already applied to `uid` and `path`,
// so there is no index handling here.
const props = defineProps<{
  widget: NonFunctionWidget<string>;
}>();

const formContext = useVueFormContext();
const LoadedComponent = shallowRef<Component | null>(null);
const isMounted = ref(true);

// Read here so the very first render already shows the widget. A server render never
// reaches onMounted and cannot await the dynamic import, so this read must happen in setup.
// `preloaded` is kept in a local because testing LoadedComponent.value below would
// narrow the ref type and reject the assignment in the async path.
const preloaded = formContext.widgetRegistry.getIfLoaded(props.widget.type);
if (preloaded) {
  LoadedComponent.value = preloaded;
}

onMounted(async () => {
  if (preloaded) {
    return;
  }
  try {
    const loaded = await formContext.widgetRegistry.loadWidget(props.widget.type);
    if (!isMounted.value) return;
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
  <WidgetErrorBoundary v-if="LoadedComponent" :widget="props.widget">
    <component :is="LoadedComponent" :widget="props.widget" />
  </WidgetErrorBoundary>
</template>
