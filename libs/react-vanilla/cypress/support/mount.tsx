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
  mount(
    <FormComponent
      formDef={options.formDef}
      middlewares={options.middlewares ?? []}
      validators={options.validators}
      fieldLoaders={fieldLoaders}
    />,
  );
};
