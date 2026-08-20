import { defineForm } from '@golemui/core';
import { type FormHandle, type MountComponentFn } from '../utils';

export const runReinitComponentTests = (mountFn: MountComponentFn) => {
  describe('Config replacement', () => {
    const firstNameFormDef = () =>
      defineForm({
        form: [
          {
            uid: 'firstName',
            kind: 'input',
            type: 'textinput',
            path: 'firstName',
            label: 'First name',
          },
        ],
      });

    const lastNameFormDef = () =>
      defineForm({
        form: [
          {
            uid: 'lastName',
            kind: 'input',
            type: 'textinput',
            path: 'lastName',
            label: 'Last name',
          },
          {
            uid: 'submitBtn',
            kind: 'action',
            type: 'button',
            label: 'Submit',
            actionType: 'submit',
          },
        ],
      });

    it('renders the new form and routes edits to the new store', () => {
      let handle: FormHandle;
      mountFn({
        formDef: firstNameFormDef(),
        data: { firstName: 'Ada' },
        onFormReady: (h) => {
          handle = h;
        },
      });

      cy.get('[data-cy="firstName_textinput"]').should('have.value', 'Ada');

      cy.then(() => {
        handle.setConfig({ formDef: lastNameFormDef(), data: { lastName: 'Lovelace' } });
      });

      cy.get('[data-cy="firstName_textinput"]').should('not.exist');
      cy.get('[data-cy="lastName_textinput"]').should('have.value', 'Lovelace');

      // The edit and the submit must reach the store the new form reads.
      cy.get('[data-cy="lastName_textinput"]').clear();
      cy.get('[data-cy="lastName_textinput"]').type('Byron');
      cy.get('[data-cy="submitBtn_button"]').click();
      cy.get('@formSubmit').should((spy: any) => {
        expect(spy.lastCall.args[0].data).to.deep.equal({ lastName: 'Byron' });
      });
    });

    it('shows the new data after a same-shape config replacement', () => {
      let handle: FormHandle;
      mountFn({
        formDef: firstNameFormDef(),
        data: { firstName: 'Ada' },
        onFormReady: (h) => {
          handle = h;
        },
      });

      cy.get('[data-cy="firstName_textinput"]').should('have.value', 'Ada');

      cy.then(() => {
        handle.setConfig({ formDef: firstNameFormDef(), data: { firstName: 'Grace' } });
      });

      cy.get('[data-cy="firstName_textinput"]').should('have.value', 'Grace');

      // The rendered form must read from the same store the handle writes to.
      cy.then(() => {
        handle.setData({ firstName: 'Hopper' });
      });
      cy.get('[data-cy="firstName_textinput"]').should('have.value', 'Hopper');
    });
  });
};
