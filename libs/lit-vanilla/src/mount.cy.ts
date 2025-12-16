import { Form } from '@golemui/core';
import { mountAndTest } from '@golemui/ui-testing';
import { html } from 'lit';
import './lib/components/form.element';

const mountLit = (formDef: Form<string>) => {
  cy.mount(html`<gui-form .formDef=${formDef}></gui-form>`);
};

mountAndTest(mountLit);
