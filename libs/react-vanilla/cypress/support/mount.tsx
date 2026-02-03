import * as Core from '@golemui/core';
import { MountOptions } from '@golemui/ui-testing';
import { mount } from 'cypress/react';
import { ComponentType } from 'react';
import { FormComponent } from '../../src/lib/components/Form';

export const mountFramework = (options: MountOptions) => {
  const fieldLoaders: Core.WidgetLoaders<ComponentType<Core.WithWidget>> =
    options.withCustomComponent
      ? {
          heading: async () =>
            (await import('../components/heading/heading.component')).HeadingComponent,
          customdate: async () => (await import('../components/custom-date/Customdate')).Customdate,
        }
      : {};

  const handleFormEvent = options.formEvent ? options.formEvent : cy.spy().as('formEvent');

  const handleFormHealth = options.formHealth ? options.formHealth : cy.spy().as('formHealth');

  mount(
    <FormComponent
      formDef={options.formDef}
      data={options.data}
      middlewares={options.middlewares ?? []}
      validators={options.validators}
      validateOn={options.validateOn ?? 'eager'}
      localization={options.localization}
      fieldLoaders={fieldLoaders}
      formEvent={handleFormEvent}
      formHealth={handleFormHealth}
    />,
  );
};
