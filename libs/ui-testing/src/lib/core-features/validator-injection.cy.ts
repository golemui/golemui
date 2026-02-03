import * as Core from '@golemui/core';
import { MountComponentFn } from '../utils';

export const runValidatorInjectionTests = (mountFn: MountComponentFn) => {
  describe('Validation issue injection', () => {
    it(`Should inject an 'Invalid date format' validation issue`, () => {
      mountFn({
        withCustomComponent: true,
        formDef: Core.defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'customdate',
              path: 'myField',
            },
          ],
        }),
      });

      cy.get('[data-cy="testSubject_customdate"]').type('1-2-3');
      cy.get('[data-cy="testSubject_validator-errors"]').should('exist');
      cy.get('[data-cy="testSubject_validator-error"]').contains('Invalid date format');
    });

    it(`Should inject an 'Impossible date' validation issue and then clear it after fixing the issue`, () => {
      mountFn({
        withCustomComponent: true,
        formDef: Core.defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'customdate',
              path: 'myField',
            },
          ],
        }),
      });

      cy.get('[data-cy="testSubject_customdate"]').type('32-02-2026');
      cy.get('[data-cy="testSubject_validator-errors"]').should('exist');
      cy.get('[data-cy="testSubject_validator-error"]').contains('Impossible date');

      cy.get('[data-cy="testSubject_customdate"]').type('{selectall}{backspace}');
      cy.get('[data-cy="testSubject_customdate"]').type('28-02-2026');
      cy.get('[data-cy="testSubject_validator-errors"]').should('not.exist');
    });

    it(`Should inject an 'Invalid date' validation issue`, () => {
      mountFn({
        withCustomComponent: true,
        formDef: Core.defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'customdate',
              path: 'myField',
            },
          ],
        }),
      });

      // Within date range, but invalid, Feb only has 28/29 days
      cy.get('[data-cy="testSubject_customdate"]').type('31-02-2026');
      cy.get('[data-cy="testSubject_validator-errors"]').should('exist');
      cy.get('[data-cy="testSubject_validator-error"]').contains('Invalid date');
    });

    it(`Should combine injected and managed validations`, () => {
      mountFn({
        withCustomComponent: true,
        formDef: Core.defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'customdate',
              path: 'myField',
              validator: {
                type: 'string',
                minLength: 10,
              },
            },
          ],
        }),
      });

      cy.get('[data-cy="testSubject_customdate"]').type('1-2-3');
      cy.get('[data-cy="testSubject_validator-errors"]').should('exist');
      cy.get('[data-cy="testSubject_validator-errors"] li')
        .eq(0)
        .contains('Too small: expected string to have >=10 characters');
      cy.get('[data-cy="testSubject_validator-errors"] li').eq(1).contains('Invalid date format');
    });
  });
};
