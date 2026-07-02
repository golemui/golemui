import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runCurrencyComponentTests = (mountFn: MountComponentFn) => {
  describe('Currency Component', () => {
    beforeEach(() => {
      mountFn({
        // Pin the locale so the formatted value assertion does not depend on
        // the machine running the tests
        localization: identityTranslator('en-US'),
        formDef: defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'currency',
              path: 'myField',
              props: {
                currency: 'USD',
              },
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
      cy.get('[data-cy="testSubject_currency"]').type('abc');
      cy.get('[data-cy="testSubject_currency"]').should('have.value', '');
    });

    it('should keep only the numeric characters when typing mixed input', () => {
      cy.get('[data-cy="testSubject_currency"]').type('x1y2z3');
      cy.get('[data-cy="testSubject_currency"]').should('have.value', '123');
    });

    it('should show the formatted currency value on blur', () => {
      cy.get('[data-cy="testSubject_currency"]').type('1234.5');
      cy.get('[data-cy="testSubject_currency"]').blur();
      cy.get('.gui-currency__format-value').should('contain.text', '$1,234.50');
    });
  });
};
