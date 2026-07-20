import type { WidgetLoaders, WithWidget } from '@golemui/core';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import type { FormComponentHandle } from '@golemui/react';
import { type MountOptions } from '@golemui/ui-testing';
import { mount } from 'cypress/react';
import { type ComponentType, createRef } from 'react';
import { GuiForm } from '../../src/lib/components/Form';

export const mountFramework = (options: MountOptions) => {
  const customWidgetLoaders: WidgetLoaders<ComponentType<WithWidget>> = options.withCustomComponent
    ? {
        heading: async () =>
          (await import('../components/heading/heading.component')).HeadingComponent,
        customdate: async () => (await import('../components/custom-date/Customdate')).Customdate,
      }
    : {};

  const handleFormEvent = options.formEvent ? options.formEvent : cy.spy().as('formEvent');

  const handleFormHealth = options.formHealth ? options.formHealth : cy.spy().as('formHealth');

  const handleFormSubmit = options.formSubmit ? options.formSubmit : cy.spy().as('formSubmit');

  const config: GuiFormInitConfig = {
    formDef: options.formDef,
    data: options.data,
    meta: options.meta,
    middlewares: options.middlewares ?? [],
    customValidators: options.validators,
    validateOn: options.validateOn ?? 'eager',
    localization: options.localization,
    dependencies: options.dependencies,
    functions: options.functions,
    customWidgetLoaders,
  };

  const formRef = createRef<FormComponentHandle>();

  mount(
    <GuiForm
      ref={formRef}
      config={config}
      formEvent={handleFormEvent}
      formHealth={handleFormHealth}
      formSubmit={handleFormSubmit}
    />,
  );

  if (options.onFormReady) {
    // mount().then() fires before React's commit phase completes, so formRef.current
    // is still null. The retry loop yields the browser event loop on each attempt,
    // allowing useImperativeHandle and useEffect (store init) to run first.
    cy.wrap(formRef)
      .its('current')
      .should('not.be.null')
      .then(() => {
        options.onFormReady!({
          setData: (data) => formRef.current!.setData(data),
          setMeta: (meta) => formRef.current!.setMeta(meta),
        });
      });
  }
};
