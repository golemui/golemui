import { defineForm } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import { html } from 'lit';
import '../../../src/lib/components/form.element';

// Lit-local: pokes reactive properties of the gui-form element directly, which the shared
// mount contract cannot express.
describe('Widget set form element properties', () => {
  it('changing a non-config property keeps the form state', () => {
    const config: GuiFormInitConfig = {
      formDef: defineForm({
        form: [
          {
            uid: 'firstName',
            kind: 'input',
            type: 'textinput',
            path: 'firstName',
            label: 'First name',
          },
        ],
      }),
      data: { firstName: 'Ada' },
      middlewares: [],
      validateOn: 'eager',
      customWidgetLoaders: {},
    };

    cy.mount(html`<gui-form .config=${config}></gui-form>`);

    cy.get('[data-cy="firstName_textinput"]').clear();
    cy.get('[data-cy="firstName_textinput"]').type('Grace');

    cy.then(() => {
      const el = document.querySelector('gui-form') as HTMLElement & { autocomplete?: string };
      el.autocomplete = 'off';
    });

    // The property change re-renders the wrapper. That must not rebuild the config,
    // so the form keeps its state instead of resetting to the config data.
    cy.get('form').should('have.attr', 'autocomplete', 'off');
    cy.get('[data-cy="firstName_textinput"]').should('have.value', 'Grace');
  });
});
