import { defineForm } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runMarkdownComponentTests = (mountFn: MountComponentFn) => {
  describe('Markdown Component', () => {
    const textarea = () => cy.get('textarea[id="testSubject"]');
    const button = (label: string) =>
      cy.get(`.gui-markdown__toolbar-button[aria-label="${label}"]`);

    const mountMarkdown = (options?: {
      data?: Record<string, unknown>;
      props?: Record<string, unknown>;
      readonly?: boolean;
      disabled?: boolean;
    }) => {
      mountFn({
        data: options?.data,
        formDef: defineForm({
          form: [
            {
              uid: 'testSubject',
              kind: 'input',
              type: 'markdown',
              path: 'myField',
              ...(options?.props ? { props: options.props } : {}),
              ...(options?.readonly !== undefined ? { readonly: options.readonly } : {}),
              ...(options?.disabled !== undefined ? { disabled: options.disabled } : {}),
            },
          ],
        }),
      });
    };

    describe('accessibility', () => {
      it('should expose a labeled toolbar of named toggle buttons', () => {
        mountMarkdown();

        cy.get('.gui-markdown__toolbar')
          .should('have.attr', 'role', 'toolbar')
          .should('have.attr', 'aria-label', 'Text formatting');
        cy.get('.gui-markdown__toolbar ul').should('have.attr', 'role', 'presentation');

        button('Bold').should('have.attr', 'aria-pressed', 'false');
        button('Heading').should('exist');
        button('Split View').should('have.attr', 'aria-pressed', 'false');
      });

      it('should honor the toolbar and button label overrides', () => {
        mountMarkdown({
          props: { toolbarAriaLabel: 'Herramientas de formato', boldTitle: 'Negrita' },
        });

        cy.get('.gui-markdown__toolbar').should(
          'have.attr',
          'aria-label',
          'Herramientas de formato',
        );
        button('Negrita').should('exist');
      });

      it('should flip aria-pressed with the format state', () => {
        mountMarkdown();

        button('Bold').click();
        textarea().should('have.value', '****');
        button('Bold').should('have.attr', 'aria-pressed', 'true');

        button('Bold').click();
        textarea().should('have.value', '');
        button('Bold').should('have.attr', 'aria-pressed', 'false');
      });

      it('should flip aria-pressed on the split view toggle', () => {
        mountMarkdown();

        button('Split View').click();
        button('Split View').should('have.attr', 'aria-pressed', 'true');
        cy.get('.gui-markdown__preview').should('exist');
      });
    });

    describe('disabled and readonly', () => {
      it('should natively disable the toolbar and never mutate the value when disabled', () => {
        mountMarkdown({ data: { myField: 'hello' }, disabled: true });

        button('Bold').should('be.disabled');
        button('Split View').should('be.disabled');

        // Regression: toolbar buttons used to stay clickable when disabled
        // and still mutated the textarea
        button('Bold').click({ force: true });
        textarea().should('have.value', 'hello');
      });

      it('should disable formatting but keep the preview toggle when readonly', () => {
        mountMarkdown({ data: { myField: 'hello' }, readonly: true });

        button('Bold').should('be.disabled');
        button('Bold').click({ force: true });
        textarea().should('have.value', 'hello');

        // Reading the preview is still allowed on a readonly field
        button('Split View').should('not.be.disabled');
        button('Split View').click();
        cy.get('.gui-markdown__preview').should('exist');
      });
    });
  });
};
