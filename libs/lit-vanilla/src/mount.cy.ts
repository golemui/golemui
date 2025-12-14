import { runAlertComponentTests } from '@golemui/ui-testing';
import { html } from 'lit';
import '../src/lib/components/form.element';

const mountLit = (formDef: Record<string, any>) => {
  cy.mount(html`<gui-form .formDef=${formDef}></gui-form>`);
};

runAlertComponentTests(mountLit);
