import type { FormSubmitEvent, WidgetLoaders, WithWidget } from '@golemui/core';
import type { Dependencies, GuiFormInitConfig } from '@golemui/gui-shared';
import type { MountOptions } from '@golemui/ui-testing';
import { h, ref, shallowRef, type Component } from 'vue';
import GuiForm from '../../src/lib/components/Form';
import type { GuiFormHandle } from '../../src/lib/components/Form.types';

export const mountFramework = (options: MountOptions) => {
  const customWidgetLoaders: WidgetLoaders<Component<WithWidget>> = options.withCustomComponent
    ? {
        heading: async () => (await import('../components/heading/HeadingComponent.vue')).default,
        customdate: async () => (await import('../components/custom-date/Customdate.vue')).default,
      }
    : {};

  const handleFormEvent = options.formEvent ? options.formEvent : cy.spy().as('formEvent');
  const handleFormHealth = options.formHealth ? options.formHealth : cy.spy().as('formHealth');
  const handleFormSubmit = options.formSubmit
    ? options.formSubmit
    : (cy.spy().as('formSubmit') as unknown as (event: FormSubmitEvent) => void);

  const config: GuiFormInitConfig = {
    formDef: options.formDef,
    data: options.data,
    meta: options.meta,
    middlewares: options.middlewares ?? [],
    customValidators: options.validators,
    validateOn: options.validateOn ?? 'eager',
    localization: options.localization,
    // The conformance MountOptions declare the open dependency record. The gui suites pass gui dependencies.
    dependencies: options.dependencies as Dependencies | undefined,
    functions: options.functions,
    customWidgetLoaders,
  };

  const formRef = ref<GuiFormHandle | null>(null);
  // `shallowRef` so the config object is handed to the form as it is, not wrapped in a
  // deep reactive proxy. Replacing `.value` is what triggers the re-render.
  const configRef = shallowRef<GuiFormInitConfig>(config);

  // Use the render-function variant of cy.mount so we can attach a template ref
  // (defineExpose) to the GuiForm instance for setData / setMeta access.
  cy.mount(() =>
    h(GuiForm as Component, {
      ref: formRef,
      config: configRef.value,
      'onForm-event': handleFormEvent,
      'onForm-health': handleFormHealth,
      'onForm-submit': handleFormSubmit,
    }),
  );

  const onFormReady = options.onFormReady;
  if (onFormReady) {
    // mount().then() resolves before Vue commits the first render and
    // defineExpose populates the ref. Retry until the ref is set.
    cy.wrap(formRef)
      .its('value')
      .should('not.be.null')
      .then(() => {
        const handle = formRef.value;
        if (!handle) return;
        onFormReady({
          setData: (data) => handle.setData(data),
          setMeta: (meta) => handle.setMeta(meta),
          setConfig: (next) => {
            configRef.value = {
              ...configRef.value,
              formDef: next.formDef,
              data: next.data,
              meta: next.meta,
            };
          },
        });
      });
  }
};
