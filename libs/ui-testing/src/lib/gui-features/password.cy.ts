import { defineForm } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runPasswordComponentTests = (mountFn: MountComponentFn) => {
  describe('Password Component', () => {
    const input = () => cy.get('[data-cy="testSubject_password"]');
    const toggle = () => cy.get('.gui-password__toggle');

    const mountPassword = (props?: Record<string, unknown>) => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'password',
              path: 'myField',
              ...(props ? { props } : {}),
            },
          ],
        }),
      });
    };

    it('should toggle the input between password and text', () => {
      mountPassword();

      input().should('have.attr', 'type', 'password');
      toggle().click();
      input().should('have.attr', 'type', 'text');
      toggle().click();
      input().should('have.attr', 'type', 'password');
    });

    describe('accessibility', () => {
      it('should expose a focusable, named visibility toggle', () => {
        mountPassword();

        toggle().should('not.have.attr', 'tabindex');
        toggle().focus();
        cy.focused().should('have.class', 'gui-password__toggle');
        toggle().should('have.attr', 'aria-label', 'Show password');
      });

      it('should flip the accessible name with the visibility state', () => {
        mountPassword();

        toggle().click();
        toggle().should('have.attr', 'aria-label', 'Hide password');
        toggle().click();
        toggle().should('have.attr', 'aria-label', 'Show password');
      });

      it('should honor the label override props and hide the visible text from AT', () => {
        mountPassword({ showPasswordLabel: 'Mostrar', hidePasswordLabel: 'Ocultar' });

        toggle().should('have.attr', 'aria-label', 'Mostrar');
        toggle().find('span').should('have.attr', 'aria-hidden', 'true');
        toggle().click();
        toggle().should('have.attr', 'aria-label', 'Ocultar');
      });

      it('should keep the toggle named when icons are configured', () => {
        mountPassword({ showPasswordIcon: 'icon-eye', hidePasswordIcon: 'icon-eye-off' });

        toggle().should('have.attr', 'aria-label', 'Show password');
        toggle().find('span').should('not.exist');
      });
    });
  });
};
