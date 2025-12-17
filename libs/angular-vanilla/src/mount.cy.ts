import { CommonModule } from '@angular/common';
import * as Angular from '@golemui/angular';
import { Action, Form, Middleware, State } from '@golemui/core';
import { mountAndTest } from '@golemui/ui-testing';
import { mount } from 'cypress/angular';
import { FormComponent } from './lib/components/form/form.component';
import { CustomValidatorSchemas } from '@golemui/validators-vanilla';

const mountAngular = (
  formDef: Form<string>,
  middlewares: Middleware<State, Action>[] = [],
  validators: CustomValidatorSchemas = {},
) => {
  mount(FormComponent, {
    imports: [CommonModule, Angular.FormCoreComponent],
    componentProperties: { formDef, middlewares, validators },
  });
};

mountAndTest(mountAngular);
