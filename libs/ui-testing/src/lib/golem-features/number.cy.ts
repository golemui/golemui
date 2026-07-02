import { defineForm } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runNumberComponentTests = (mountFn: MountComponentFn) => {
  describe('Number Component', () => {
    beforeEach(() => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'number',
              path: 'myField',
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
    });

    // Chrome filters letters natively on number inputs but Firefox does not,
    // so the widget must block them itself
    it('should not allow typing letters', () => {
      cy.get('[data-cy="testSubject_number"]').type('abc');
      cy.get('[data-cy="testSubject_number"]').should('have.value', '');
    });

    it('should keep only the numeric characters when typing mixed input', () => {
      cy.get('[data-cy="testSubject_number"]').type('x1y2z3');
      cy.get('[data-cy="testSubject_number"]').should('have.value', '123');
    });

    it('should accept decimal numbers', () => {
      cy.get('[data-cy="testSubject_number"]').type('12.5');
      cy.get('[data-cy="testSubject_number"]').should('have.value', '12.5');
    });
  });
};
