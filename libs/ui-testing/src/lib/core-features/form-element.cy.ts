import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

const OUTSIDE_BUTTON_SELECTOR = '[data-cy="outside-submit"]';

const FORM_NAME = 'signupForm';

const requiredNameForm = () =>
  defineForm({
    form: [
      {
        uid: 'name',
        kind: 'input',
        type: 'textinput',
        path: 'name',
        validator: { type: 'string', required: true },
      },
      { uid: 'submit', kind: 'action', type: 'button', label: 'Submit', actionType: 'submit' },
    ],
  });

const formElement = () => cy.get<HTMLFormElement>(`form#${FORM_NAME}`);

// The spec tsconfigs have no dom.iterable lib, so FormData has forEach but no keys().
const formDataKeys = (form: HTMLFormElement) => {
  const keys: string[] = [];
  new FormData(form).forEach((_value, key) => keys.push(key));
  return keys;
};

/**
 * Registers the tests for the native form element: its attributes, the ways a host or the user
 * submits it, and what a native submit does.
 *
 * @param mountFn - Mounts a form with the options and the framework of the calling package.
 */
export const runFormElementComponentTests = (mountFn: MountComponentFn) => {
  describe('Native form element', () => {
    describe('attributes', () => {
      it('should use formName as the id and set novalidate, dir and autocomplete', () => {
        mountFn({
          formDef: requiredNameForm(),
          formName: FORM_NAME,
          autocomplete: 'off',
          // Without a localization the language comes from the browser, which can be rtl.
          localization: identityTranslator('en'),
        });

        formElement().should('have.attr', 'novalidate');
        formElement().should('have.attr', 'dir', 'ltr');
        formElement().should('have.attr', 'autocomplete', 'off');
      });

      it('should set dir to rtl for a right-to-left language', () => {
        mountFn({
          formDef: requiredNameForm(),
          formName: FORM_NAME,
          localization: identityTranslator('ar'),
        });

        formElement().should('have.attr', 'dir', 'rtl');
      });

      it('should put the gui-form class on the parent of the form element', () => {
        mountFn({ formDef: requiredNameForm(), formName: FORM_NAME });

        formElement().parent().should('have.class', 'gui-form');
      });

      it('should send no entries in a FormData of the form element', () => {
        mountFn({ formDef: requiredNameForm(), formName: FORM_NAME });

        cy.get('[data-cy="name_textinput"]').type('Joan');
        formElement().should((form) => {
          expect(formDataKeys(form[0])).to.deep.equal([]);
        });

        // Control: a named native input in the same form is sent.
        formElement().then((form) => {
          const input = document.createElement('input');
          input.name = 'control';
          input.value = '1';
          form[0].appendChild(input);
          expect(formDataKeys(form[0])).to.deep.equal(['control']);
          input.remove();
        });
      });
    });

    describe('submit', () => {
      // The outside button is added to the body, which the mount does not clear.
      afterEach(() => {
        cy.document().then((doc) => doc.querySelector(OUTSIDE_BUTTON_SELECTOR)?.remove());
      });

      it('should submit the data once when the user presses Enter in a field', () => {
        mountFn({
          formDef: requiredNameForm(),
          formName: FORM_NAME,
          formSubmit: cy.stub().as('formSubmit'),
        });

        cy.get('[data-cy="name_textinput"]').type('Joan{enter}');
        cy.get('@formSubmit').should('have.been.calledOnce');
        cy.get('@formSubmit').its('firstCall.args.0.data').should('deep.equal', { name: 'Joan' });
      });

      it('should not submit and should show the error when the user presses Enter in an invalid form', () => {
        mountFn({
          formDef: requiredNameForm(),
          formName: FORM_NAME,
          formSubmit: cy.stub().as('formSubmit'),
        });

        cy.get('[data-cy="name_textinput"]').type('{enter}');
        cy.get('[data-cy="name_validator-errors"]').should('exist');
        cy.get('@formSubmit').should('not.have.been.called');

        // Control: the same key submits once the field is valid.
        cy.get('[data-cy="name_textinput"]').type('Joan{enter}');
        cy.get('@formSubmit').should('have.been.calledOnce');
      });

      it('should submit when the host calls requestSubmit on the form element', () => {
        mountFn({
          formDef: requiredNameForm(),
          formName: FORM_NAME,
          data: { name: 'Joan' },
          formSubmit: cy.stub().as('formSubmit'),
        });

        cy.get('[data-cy="name_textinput"]').should('have.value', 'Joan');
        formElement().then((form) => form[0].requestSubmit());
        cy.get('@formSubmit').should('have.been.calledOnce');
        cy.get('@formSubmit').its('firstCall.args.0.data').should('deep.equal', { name: 'Joan' });
      });

      it('should submit when the user clicks a host submit button outside the form that names it', () => {
        mountFn({
          formDef: requiredNameForm(),
          formName: FORM_NAME,
          data: { name: 'Joan' },
          formSubmit: cy.stub().as('formSubmit'),
        });

        cy.get('[data-cy="name_textinput"]').should('have.value', 'Joan');
        cy.document().then((doc) => {
          const button = doc.createElement('button');
          button.type = 'submit';
          button.setAttribute('form', FORM_NAME);
          button.setAttribute('data-cy', 'outside-submit');
          button.textContent = 'Send';
          doc.body.appendChild(button);
        });
        cy.get(OUTSIDE_BUTTON_SELECTOR).click();
        cy.get('@formSubmit').should('have.been.calledOnce');
      });

      it('should prevent the default action of the native submit event', () => {
        mountFn({
          formDef: requiredNameForm(),
          formName: FORM_NAME,
          data: { name: 'Joan' },
          formSubmit: cy.stub().as('formSubmit'),
        });

        cy.get('[data-cy="name_textinput"]').should('have.value', 'Joan');
        formElement().then((form) => {
          const event = new SubmitEvent('submit', { bubbles: true, cancelable: true });
          const notPrevented = form[0].dispatchEvent(event);
          expect(notPrevented, 'dispatchEvent result').to.equal(false);
        });
        // The same event reached the form's own handler.
        cy.get('@formSubmit').should('have.been.calledOnce');
      });
    });
  });
};
