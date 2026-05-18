<script setup lang="ts">
import type { FormEvent, FormHealth, FormInitConfig, WidgetLoaders, WithWidget } from '@golemui/core';
import { resolveFormInput } from '@golemui/gui-shared/internals';
import { initValidators } from '@golemui/gui-validators';
import { FormComponent, type FormComponentHandle, type VueItemRenderer } from '@golemui/vue';
import { computed, ref, type Component } from 'vue';
import { widgetLoaders as golemWidgetLoaders } from '../widget.loaders';
import type { GuiFormEmits, GuiFormHandle, GuiFormProps } from './Form.types';

const props = defineProps<GuiFormProps>();
const emit = defineEmits<GuiFormEmits>();

const formRef = ref<FormComponentHandle | null>(null);

const resolved = computed(() =>
  resolveFormInput(props.config.formDef, props.config.formSelectors, props.config.formConfig),
);

const coreConfig = computed<FormInitConfig<Component<WithWidget>>>(() => {
  const r = resolved.value;
  return {
    formDef: r.formDef as string | Record<string, any>,
    widgetLoaders: {
      ...golemWidgetLoaders,
      ...(r.widgetLoaders as WidgetLoaders<Component<WithWidget>>),
      ...((props.config.customWidgetLoaders ?? {}) as WidgetLoaders<Component<WithWidget>>),
    },
    dependencies: { ...(r.dependencies ?? {}), ...(props.config.dependencies ?? {}) },
    validateOn: props.config.validateOn ?? r.validateOn ?? 'eager',
    itemRenderers: {
      ...((r.itemRenderers ?? {}) as Record<string, VueItemRenderer<any>>),
      ...((props.config.itemRenderers ?? {}) as Record<string, VueItemRenderer<any>>),
    },
    localization: props.config.localization,
    middlewares: props.config.middlewares ?? [],
    data: props.config.data,
    meta: props.config.meta,
    formName: props.config.formName,
  };
});

const allValidators = computed(() => initValidators({ ...(props.config.customValidators ?? {}) }));

const onInnerFormEvent = (event: FormEvent) => {
  resolved.value.formEvent?.(event);
  emit('form-event', event);
};

const onInnerFormHealth = (health: FormHealth) => emit('form-health', health);

defineExpose<GuiFormHandle>({
  setData: (data) => formRef.value?.setData(data),
  setMeta: (meta) => formRef.value?.setMeta(meta),
});
</script>

<template>
  <FormComponent
    ref="formRef"
    :config="coreConfig"
    :validators="allValidators"
    :autocomplete="autocomplete"
    @form-event="onInnerFormEvent"
    @form-health="onInnerFormHealth"
  />
</template>
