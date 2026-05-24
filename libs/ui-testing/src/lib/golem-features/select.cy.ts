import { defineForm } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runSelectComponentTests = (mountFn: MountComponentFn) => {
  describe('Select Component', () => {
    it('should display validation error when defaultValue is not in options and click submit', () => {
      mountFn({
        data: { myField: 'd' },
        formDef: defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'select',
              path: 'myField',
              props: {
                options: ['a', 'b', 'c'],
              },
            },
            {
              uid: 'testButton',
              kind: 'action',
              type: 'button',
              label: 'Test',
              actionType: 'submit',
            },
          ],
        }),
      });

      cy.get('[data-cy="testButton_button"]').click();
      cy.get('[data-cy="testSubject_validator-errors"]').should('exist');
      cy.get('[data-cy="testSubject_validator-error"]').should('be.visible');
      cy.get('[data-cy="testSubject_validator-error"]').contains(
        `Invalid selection: 'd' is not a valid option.`,
      );
    });
  });
};
