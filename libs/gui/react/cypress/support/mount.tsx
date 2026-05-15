import * as Core from '@golemui/core';
import { GuiFormInitConfig } from '@golemui/gui-shared';
import { MountOptions } from '@golemui/ui-testing';
import { mount } from 'cypress/react';
import { ComponentType } from 'react';
import { GuiForm } from '../../src/lib/components/Form';

export const mountFramework = (options: MountOptions) => {
  const customWidgetLoaders: Core.WidgetLoaders<ComponentType<Core.WithWidget>> =
    options.withCustomComponent
      ? {
          heading: async () =>
            (await import('../components/heading/heading.component')).HeadingComponent,
          customdate: async () => (await import('../components/custom-date/Customdate')).Customdate,
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

  mount(
    <GuiForm
      config={config}
      formEvent={handleFormEvent}
      formHealth={handleFormHealth}
    />,
  );
};
