import { MountOptions } from '@golemui/ui-testing';
import * as Core from '@golemui/core';
import { ComponentType } from 'react';
import { mount } from 'cypress/react';
import { FormComponent } from '../../src/lib/components/Form';

export const mountFramework = (options: MountOptions) => {
  const fieldLoaders: Core.FieldLoaders<ComponentType<Core.WithField>> = options.withCustomComponent
    ? {
        heading: async () =>
          (await import('../components/heading/heading.component')).HeadingComponent,
      }
    : {};

  const handleFormEvent = options.formEvent ? options.formEvent : cy.spy().as('formEvent');

  const handleFormError = options.formError ? options.formError : cy.spy().as('formError');

  mount(
    <FormComponent
      formDef={options.formDef}
      data={options.data}
      middlewares={options.middlewares ?? []}
      validators={options.validators}
      validateOn={options.validateOn ?? 'eager'}
      fieldLoaders={fieldLoaders}
      formEvent={handleFormEvent}
      formError={handleFormError}
    />,
  );
};
