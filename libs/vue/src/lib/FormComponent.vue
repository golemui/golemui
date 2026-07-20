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
        <WidgetErrorBoundary v-if="formLayoutField" :widget="formLayoutField">
          <WidgetRenderer :widget="formLayoutField" />
        </WidgetErrorBoundary>
      </form>
    </div>
  </component>
</template>
