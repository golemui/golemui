<script setup lang="ts">
import {
  type LayoutWidget,
  formHealth as watchFormHealth,
  getDirectionFromLanguage,
  shortUUID,
} from '@golemui/core';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import WidgetErrorBoundary from './WidgetErrorBoundary.vue';
import WidgetRenderer from './WidgetRenderer.vue';
import { VueFormContext } from './VueFormContext';
import { provideFormContext } from './provideFormContext';
import type {
  FormComponentEmits,
  FormComponentHandle,
  FormComponentProps,
} from './FormComponent.types';

const props = defineProps<FormComponentProps>();
const emit = defineEmits<FormComponentEmits>();

const formContext = new VueFormContext();
const formName = ref<string>(props.config.formName ?? shortUUID());
const formLayoutField = ref<LayoutWidget<string> | null>(null);
const direction = ref<'ltr' | 'rtl'>('ltr');
const storeVersion = ref(0);

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
  );
  storeVersion.value += 1;
};

reinit();

watch(
  () => [props.config, props.validators],
  () => reinit(),
  { flush: 'post' },
);

watch(
  () => [props.config.formDef, storeVersion.value],
  () => {
    formContext.store.dispatch({
      type: 'INITIALIZE',
      payload: {
        formName: formName.value,
        formDef: props.config.formDef,
      },
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
    healthSub = watchFormHealth(formContext.store.state$).subscribe((health) =>
      emit('form-health', health),
    );
  },
  { immediate: true },
);

const eventSub = formContext.events$.subscribe((event) => emit('form-event', event));

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
  unsubscribeLang?.();
});

defineExpose<FormComponentHandle>({
  setData: (data) => formContext.store.dispatch({ type: 'SET_DATA', payload: { data } }),
  setMeta: (meta) => formContext.store.dispatch({ type: 'SET_META', payload: { meta } }),
});
</script>

<template>
  <div v-if="formLayoutField" class="gui-form">
    <form :id="formName" novalidate :dir="direction" :autocomplete="autocomplete">
      <WidgetErrorBoundary :widget="formLayoutField">
        <WidgetRenderer :widget="formLayoutField" />
      </WidgetErrorBoundary>
    </form>
  </div>
</template>
