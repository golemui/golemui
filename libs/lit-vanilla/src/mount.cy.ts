import { Action, Form, Middleware, State } from '@golemui/core';
import { mountAndTest } from '@golemui/ui-testing';
import { html } from 'lit';
import './lib/components/form.element';
import { CustomValidatorSchemas } from '@golemui/validators-vanilla';

const mountLit = (
  formDef: Form<string>,
  middlewares: Middleware<State, Action>[] = [],
  validators: CustomValidatorSchemas = {},
) => {
  cy.mount(
    html`<gui-form
      .formDef=${formDef}
      .middlewares=${middlewares}
      .validators=${validators}
    ></gui-form>`,
  );
};

mountAndTest(mountLit);
