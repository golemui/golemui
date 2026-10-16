import { defineForm } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import '@golemui/gui-components/dialog';
import { html } from 'lit';
import '../../../src/lib/components/form.element';

// Lit-local: the shared mount contract renders the form on its own, and this needs it inside a
// modal gui-dialog. A form in a dialog is the main reason for the dialog: it must validate and
// submit there, and the panels of its pickers and dropdowns must float above the dialog's edges.

const config = (): GuiFormInitConfig => ({
  formDef: defineForm({
    form: [
      {
        uid: 'name',
        kind: 'input',
        type: 'textinput',
        path: 'name',
        label: 'Name',
        validator: { type: 'string', required: true },
      },
      { uid: 'start', kind: 'input', type: 'datePicker', path: 'start', label: 'Start date' },
      {
        uid: 'plan',
        kind: 'input',
        type: 'dropdown',
        path: 'plan',
        label: 'Plan',
        props: { items: ['Starter', 'Team', 'Business'], inputDebounce: 0 },
      },
      { uid: 'save', kind: 'action', type: 'button', label: 'Save', actionType: 'submit' },
    ],
  }),
  data: {},
  middlewares: [],
  validateOn: 'submit',
  customWidgetLoaders: {},
});

const mount = () => {
  const onSubmit = cy.spy().as('formSubmit');
  cy.mount(
    html`<gui-dialog open>
      <dialog id="profile" aria-label="Edit profile">
        <gui-form .config=${config()} @formSubmit=${onSubmit}></gui-form>
      </dialog>
    </gui-dialog>`,
  );
  cy.get('#profile').should('match', ':modal');
};

/** Waits until the panel is open and shows whole: the middle of its last row of pixels is its own. */
const showsWhole = (selector: string) =>
  cy.get(selector).should(([panel]) => {
    expect(panel.matches(':popover-open'), 'in the top layer').to.equal(true);
    const { x, width, bottom } = panel.getBoundingClientRect();
    const under = panel.ownerDocument.elementFromPoint(x + width / 2, bottom - 2);
    expect(panel.contains(under), 'its bottom edge shows').to.equal(true);
  });

describe('a GolemUI form in a gui-dialog', () => {
  it('validates and submits without closing the dialog', () => {
    mount();

    cy.get('[data-cy="save_button"]').click();
    cy.get('[data-cy="name_validator-errors"]').should('exist');
    cy.get('@formSubmit').should('not.have.been.called');

    cy.get('[data-cy="name_textinput"]').type('Ada');
    cy.get('[data-cy="save_button"]').click();
    cy.get('@formSubmit').should('have.been.calledOnce');
    cy.get('@formSubmit').its('firstCall.args.0.detail.data.name').should('equal', 'Ada');
    cy.get('#profile').should('match', ':modal');
  });

  it("shows its date picker's panel above the dialog, unclipped", () => {
    mount();

    cy.get('.gui-date-picker__arrow').click();
    showsWhole('gui-date-picker .gui-picker__panel');
  });

  it("shows its dropdown's panel above the dialog, unclipped", () => {
    mount();

    cy.get('.gui-dropdown__arrow').click();
    showsWhole('.gui-dropdown .gui-widget > .gui-picker__panel');
  });

  // The browser closes a modal dialog on a trusted Escape only, which Cypress sends in Chromium.
  if (Cypress.isBrowser({ family: 'chromium' })) {
    const pressEscape = () =>
      cy.then(async () => {
        const key = { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 };
        const send = (type: string) =>
          Cypress.automation('remote:debugger:protocol', {
            command: 'Input.dispatchKeyEvent',
            params: { type, ...key },
          });
        await send('rawKeyDown');
        await send('keyUp');
      });

    it("closes an open dropdown's panel on Escape, and the dialog on the next one", () => {
      mount();

      cy.get('.gui-dropdown__arrow').click();
      cy.get('[data-cy="plan_textinput"]').focus();
      pressEscape();
      cy.get('.gui-dropdown .gui-widget > .gui-picker__panel').should('not.match', ':popover-open');
      cy.get('#profile').should('match', ':modal');

      pressEscape();
      cy.get('#profile').should('not.match', ':modal');
    });
  }
});
