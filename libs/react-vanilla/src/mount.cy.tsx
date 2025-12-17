import { Action, Form, Middleware, State } from '@golemui/core';
import { mountAndTest } from '@golemui/ui-testing';
import { mount } from 'cypress/react';
import { FormComponent } from './lib/components/Form';
import { CustomValidatorSchemas } from '@golemui/validators-vanilla';

const mountReact = (
  formDef: Form<string>,
  middlewares: Middleware<State, Action>[] = [],
  validators: CustomValidatorSchemas = {},
) => {
  const fieldLoaders = {
    heading: async () =>
      (await import('../cypress/components/heading/heading.component')).HeadingComponent,
  };
  mount(
    <FormComponent
      formDef={formDef}
      middlewares={middlewares}
      validators={validators}
      fieldLoaders={fieldLoaders}
    />,
  );
};

mountAndTest(mountReact);
