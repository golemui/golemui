import { CommonModule } from '@angular/common';
import { mount } from 'cypress/angular';
import { FormComponent } from './lib/components/form/form.component';
import { mountAndTest } from '@golemui/ui-testing';
import { Action, Form, Middleware, State } from '@golemui/core';
import { CustomValidatorSchemas } from '@golemui/validators-vanilla';
import { FormCoreComponent } from '@golemui/angular';

const mountAngular = (
  formDef: Form<string>,
  middlewares: Middleware<State, Action>[] = [],
  validators: CustomValidatorSchemas = {},
) => {
  const fieldLoaders = {
    heading: async () =>
      (await import('../cypress/components/heading/heading.component')).HeadingComponent,
  };
  mount(FormComponent, {
    imports: [CommonModule, FormCoreComponent],
    componentProperties: { formDef, middlewares, validators, fieldLoaders },
  });
};

mountAndTest(mountAngular);
