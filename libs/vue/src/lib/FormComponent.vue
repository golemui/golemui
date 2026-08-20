<script setup lang="ts">
import {
  type FormEvent,
  type FormHealth,
  type FormSubmitEvent,
  type LayoutWidget,
  formHealth as watchFormHealth,
  getDirectionFromLanguage,
  shortUUID,
} from '@golemui/core';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import DefaultFormHealthBoundary from './DefaultFormHealthBoundary.vue';
import WidgetErrorBoundary from './WidgetErrorBoundary.vue';
import WidgetRenderer from './WidgetRenderer.vue';
import { VueFormContext } from './VueFormContext';
import { provideFormContext } from './provideFormContext';
import type { FormComponentHandle, FormComponentProps } from './FormComponent.types';

const props = defineProps<FormComponentProps>();
const emit = defineEmits<{
  'form-event': [event: FormEvent];
  'form-submit': [event: FormSubmitEvent];
  'form-health': [health: FormHealth];
}>();

const formContext = new VueFormContext();
const formName = ref<string>(props.config.formName ?? shortUUID());
const formLayoutField = ref<LayoutWidget<string> | null>(null);
const health = ref<FormHealth>({ status: 'ok' });
const direction = ref<'ltr' | 'rtl'>('ltr');
const storeVersion = ref(0);
// Keys the widget tree. Every INITIALIZE bumps it, so the whole tree is destroyed and
// recreated and every widget subscribes to the store that INITIALIZE ran on.
const treeGeneration = ref(0);

provideFormContext(formContext);

const reinit = () => {
  formContext.initialize(
    props.config.widgetLoaders,
    props.config.middlewares ?? [],
    props.validators,
    props.config.validateOn ?? 'eager',
    props.config.itemRenderers ?? {},
    props.config.localization,
    props.config.dependencies ?? {},
    props.config.functions ?? {},
  );
  storeVersion.value += 1;
};

reinit();

// This watcher is created before the ones below, so on a config replacement it runs first
// in the same flush: the store is already the new one when they dispatch into it.
watch(
  () => [props.config, props.validators],
  () => reinit(),
);

// INITIALIZE resets the store and derives nothing. A new store gets its data and meta from the
// watchers below, but a formDef replaced on the same config object does not bump storeVersion,
// so this watcher dispatches them itself.
let initializedStoreVersion = -1;
let initializedConfig: FormComponentProps['config'] | null = null;
watch(
  () => [props.config.formDef, storeVersion.value],
  () => {
    const storeIsNew = storeVersion.value !== initializedStoreVersion;
    const configIsNew = props.config !== initializedConfig;
    initializedStoreVersion = storeVersion.value;
    initializedConfig = props.config;
    treeGeneration.value += 1;
    formContext.store.dispatch({
      type: 'INITIALIZE',
      payload: {
        formName: formName.value,
        formDef: props.config.formDef,
      },
    });
    if (storeIsNew || configIsNew) {
      return;
    }
    formContext.store.dispatch({
      type: 'SET_DATA',
      payload: { data: props.config.data || {} },
    });
    formContext.store.dispatch({
      type: 'SET_META',
      payload: { meta: props.config.meta || {} },
    });
  },
  { immediate: true },
);

watch(
  () => [props.config.data, storeVersion.value],
  () => {
    formContext.store.dispatch({
      type: 'SET_DATA',
      payload: { data: props.config.data || {} },
    });
  },
  { immediate: true },
);

watch(
  () => [props.config.meta, storeVersion.value],
  () => {
    formContext.store.dispatch({
      type: 'SET_META',
      payload: { meta: props.config.meta || {} },
    });
  },
  { immediate: true },
);

let entrySub: { unsubscribe(): void } | null = null;
watch(
  () => storeVersion.value,
  () => {
    entrySub?.unsubscribe();
    entrySub = formContext.store.state$.subscribe((state) => {
      formLayoutField.value = state.formDef.form;
      direction.value = getDirectionFromLanguage(formContext.localization.lang);
    });
  },
  { immediate: true },
);

let healthSub: { unsubscribe(): void } | null = null;
watch(
  () => storeVersion.value,
  () => {
    healthSub?.unsubscribe();
    healthSub = watchFormHealth(formContext.store.state$).subscribe((next) => {
      health.value = next;
      if (next.status === 'errored') {
        console.error('GolemUI form failed to initialize:', next.message);
      }
      emit('form-health', next);
    });
  },
  { immediate: true },
);

/**
 * Stable events subscriptions.
 * ( Stable events are those that survive store replacements )
 */
const eventSub = formContext.events$.subscribe((event) => emit('form-event', event));
const submitSub = formContext.submit$.subscribe((event) => emit('form-submit', event));

let unsubscribeLang: (() => void) | null = null;
onMounted(() => {
  unsubscribeLang = formContext.localization.subscribe((lang) => {
    direction.value = getDirectionFromLanguage(lang);
    formContext.store.dispatch({
      type: 'SET_LANGUAGE',
      payload: { lang },
    });
  });
});

onUnmounted(() => {
  entrySub?.unsubscribe();
  healthSub?.unsubscribe();
  eventSub.unsubscribe();
  submitSub.unsubscribe();
  unsubscribeLang?.();
});

defineExpose<FormComponentHandle>({
  setData: (data) => formContext.store.dispatch({ type: 'SET_DATA', payload: { data } }),
  setMeta: (meta) => formContext.store.dispatch({ type: 'SET_META', payload: { meta } }),
});

const onFormSubmit = (event: SubmitEvent) => {
  event.preventDefault();
  formContext.emitSubmitEvent();
};
</script>

<template>
  <!-- Always render the form inside the boundary so a recovered health clears the error in place. -->
  <component :is="formHealthBoundary ?? DefaultFormHealthBoundary" :health="health">
    <div class="gui-form">
      <form
        :id="formName"
        novalidate
        :dir="direction"
        :autocomplete="autocomplete"
        @submit.stop="onFormSubmit"
      >
        <WidgetErrorBoundary v-if="formLayoutField" :key="treeGeneration" :widget="formLayoutField">
          <WidgetRenderer :widget="formLayoutField" />
        </WidgetErrorBoundary>
      </form>
    </div>
  </component>
</template>
