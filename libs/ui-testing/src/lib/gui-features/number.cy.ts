import { defineForm } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runNumberComponentTests = (mountFn: MountComponentFn) => {
  describe('Number Component', () => {
    const input = () => cy.get('[data-cy="testSubject_number"]');

    const mountNumber = (props?: Record<string, unknown>) => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'number',
              path: 'myField',
              ...(props ? { props } : {}),
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
    };

    describe('input filtering', () => {
      beforeEach(() => {
        mountNumber();
      });

      // Chrome filters letters natively on number inputs but Firefox does not,
      // so the widget must block them itself
      it('should not allow typing letters', () => {
        input().type('abc');
        input().should('have.value', '');
      });

      it('should keep only the numeric characters when typing mixed input', () => {
        input().type('x1y2z3');
        input().should('have.value', '123');
      });

      it('should accept decimal numbers', () => {
        input().type('12.5');
        input().should('have.value', '12.5');
      });
    });

    describe('accessibility', () => {
      it('should surface minimum and maximum as native min/max', () => {
        mountNumber({ minimum: 1, maximum: 10 });
        input().should('have.attr', 'min', '1');
        input().should('have.attr', 'max', '10');
      });

      it('should not render min/max when no bounds are set', () => {
        mountNumber();
        input().should('not.have.attr', 'min');
        input().should('not.have.attr', 'max');
      });

      it('should surface a minimum or maximum of 0', () => {
        mountNumber({ minimum: 0, maximum: 0 });
        input().should('have.attr', 'min', '0');
        input().should('have.attr', 'max', '0');
      });
    });

    describe('keyboard stepping', () => {
      it('should clamp ArrowDown at a minimum of 0', () => {
        mountNumber({ minimum: 0 });
        input().type('1');
        input().type('{downArrow}');
        input().should('have.value', '0');
        input().type('{downArrow}');
        input().should('have.value', '0');
      });
    });
  });
};
