import type { WidgetLoaders, WithWidget } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import type { GuiFormHandle } from '@golemui/gui-vue';
import { GuiForm } from '@golemui/gui-vue';
import type { MountOptions } from '@golemui/ui-testing';
import { h, ref, type Component } from 'vue';

export const mountFramework = (options: MountOptions) => {
  const customWidgetLoaders: WidgetLoaders<Component<WithWidget>> = options.withCustomComponent
    ? {
        heading: async () =>
          (await import('../components/heading/HeadingComponent.vue')).default,
        customdate: async () =>
          (await import('../components/custom-date/Customdate.vue')).default,
      }
    : {};

  const handleFormEvent = options.formEvent ? options.formEvent : cy.spy().as('formEvent');
  const handleFormHealth = options.formHealth ? options.formHealth : cy.spy().as('formHealth');

  const config: GuiFormInitConfig = {
    formDef: options.formDef,
    data: options.data,
    meta: options.meta,
    middlewares: options.middlewares ?? [],
    customValidators: options.validators,
    validateOn: options.validateOn ?? 'eager',
    localization: options.localization,
    dependencies: options.dependencies,
    customWidgetLoaders,
  };

  const formRef = ref<GuiFormHandle | null>(null);

  // Use the render-function variant of cy.mount so we can attach a template ref
  // (defineExpose) to the GuiForm instance for setData / setMeta access.
  cy.mount(() =>
    h(GuiForm as Component, {
      ref: formRef,
      config,
      'onForm-event': handleFormEvent,
      'onForm-health': handleFormHealth,
    }),
  );

  if (options.onFormReady) {
    // mount().then() resolves before Vue commits the first render and
    // defineExpose populates the ref. Retry until the ref is set.
    cy.wrap(formRef)
      .its('value')
      .should('not.be.null')
      .then(() => {
        options.onFormReady!({
          setData: (data) => formRef.value!.setData(data),
          setMeta: (meta) => formRef.value!.setMeta(meta),
        });
      });
  }
};
