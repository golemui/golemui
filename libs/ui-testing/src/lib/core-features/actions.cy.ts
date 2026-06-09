import { type MountComponentFn } from '../utils';
import { golemForm } from '@golemui/gui-shared/internals';

export const runActionsComponentTests = (mountFn: MountComponentFn) => {
  describe('Actions', () => {
    context('Submit button invalid state', () => {
      it('should not have the invalid class before any submit attempt', () => {
        mountFn({
          formDef: golemForm().create({
            form: [
              {
                uid: 'name',
                kind: 'input',
                type: 'textinput',
                path: 'name',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'submitBtn',
                kind: 'action',
                type: 'button',
                label: 'Submit',
                actionType: 'submit',
              },
            ],
          }),
        });

        cy.get('[data-cy="submitBtn_button"]').should('not.have.class', 'gui-button--invalid');
      });

      it('should apply the invalid class when submitted with validation errors', () => {
        mountFn({
          formDef: golemForm().create({
            form: [
              {
                uid: 'name',
                kind: 'input',
                type: 'textinput',
                path: 'name',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'submitBtn',
                kind: 'action',
                type: 'button',
                label: 'Submit',
                actionType: 'submit',
              },
            ],
          }),
        });

        cy.get('[data-cy="submitBtn_button"]').click();
        cy.get('[data-cy="submitBtn_button"]').should('have.class', 'gui-button--invalid');
      });

      it('should remove the invalid class once all errors are resolved', () => {
        mountFn({
          formDef: golemForm().create({
            form: [
              {
                uid: 'name',
                kind: 'input',
                type: 'textinput',
                path: 'name',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'submitBtn',
                kind: 'action',
                type: 'button',
                label: 'Submit',
                actionType: 'submit',
              },
            ],
          }),
        });

        cy.get('[data-cy="submitBtn_button"]').click();
        cy.get('[data-cy="submitBtn_button"]').should('have.class', 'gui-button--invalid');

        cy.get('[data-cy="name_textinput"]').type('Joan');
        cy.get('[data-cy="submitBtn_button"]').should('not.have.class', 'gui-button--invalid');
      });

      it('should not apply the invalid class to a non-submit button', () => {
        mountFn({
          formDef: golemForm().create({
            form: [
              {
                uid: 'name',
                kind: 'input',
                type: 'textinput',
                path: 'name',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'plainBtn',
                kind: 'action',
                type: 'button',
                label: 'Action',
                actionType: 'button',
              },
              {
                uid: 'submitBtn',
                kind: 'action',
                type: 'button',
                label: 'Submit',
                actionType: 'submit',
              },
            ],
          }),
        });

        cy.get('[data-cy="submitBtn_button"]').click();
        cy.get('[data-cy="submitBtn_button"]').should('have.class', 'gui-button--invalid');
        cy.get('[data-cy="plainBtn_button"]').should('not.have.class', 'gui-button--invalid');
      });
    });
  });
};
