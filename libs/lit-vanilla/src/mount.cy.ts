import { Action, Form, Middleware, State } from '@golemui/core';
import { mountAndTest } from '@golemui/ui-testing';
import { html } from 'lit';
import './lib/components/form.element';

const mountLit = (formDef: Form<string>, middlewares: Middleware<State, Action>[] = []) => {
  cy.mount(html`<gui-form .formDef=${formDef} .middlewares=${middlewares}></gui-form>`);
};

mountAndTest(mountLit);
