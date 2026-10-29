import { defineForm, type FunctionWidgetParams } from '@golemui/core';
import { type MountComponentFn } from '../utils';

/**
 * Builds the framework value a `renderer` display shows: an element with the class
 * `renderer-text` that contains `text`.
 */
export type RenderTextFn = (text: string) => unknown;

/**
 * Defines the renderer display tests for one framework.
 *
 * @param mountFn - Mounts a form in the framework under test.
 * @param renderText - Builds the value the renderer shows, in the format of that framework.
 */
export const runRendererComponentTests = (mountFn: MountComponentFn, renderText: RenderTextFn) => {
  describe('Renderer Component', () => {
    const nameInput = {
      uid: 'name',
      kind: 'input' as const,
      type: 'textinput',
      path: 'name',
    };

    it('should render the value of a function widget again when the form data changes', () => {
      mountFn({
        data: { name: 'Bob' },
        formDef: defineForm({
          form: [
            nameInput,
            (api?: FunctionWidgetParams<any>) => ({
              uid: 'greeting',
              kind: 'display',
              type: 'renderer',
              props: { render: renderText(`Hello ${api?.$form.name}`) },
            }),
          ],
        }),
      });

      cy.get('[id="greeting"] .renderer-text').should('have.text', 'Hello Bob');
      cy.get('[data-cy="name_textinput"]').clear();
      cy.get('[data-cy="name_textinput"]').type('Ada');
      cy.get('[id="greeting"] .renderer-text').should('have.text', 'Hello Ada');
    });

    it('should give a renderer inside a repeater template the item of its row', () => {
      mountFn({
        data: { people: [{ name: 'Ada' }, { name: 'Bob' }] },
        formDef: defineForm({
          form: [
            {
              uid: 'people',
              kind: 'input',
              type: 'repeater',
              path: 'people',
              props: {
                template: {
                  kind: 'layout',
                  type: 'grid',
                  children: [
                    {
                      uid: 'personName',
                      kind: 'input',
                      type: 'textinput',
                      path: 'people.items.name',
                    },
                    (api?: FunctionWidgetParams<any>) => ({
                      uid: 'personGreeting',
                      kind: 'display',
                      type: 'renderer',
                      props: { render: renderText(`Row ${api?.$index}: ${api?.$item?.name}`) },
                    }),
                  ],
                },
              },
            },
          ],
        }),
      });

      cy.get('[id="personGreeting[0]"] .renderer-text').should('have.text', 'Row 0: Ada');
      cy.get('[id="personGreeting[1]"] .renderer-text').should('have.text', 'Row 1: Bob');
      cy.get('[data-cy="personName[1]_textinput"]').clear();
      cy.get('[data-cy="personName[1]_textinput"]').type('Eve');
      cy.get('[id="personGreeting[1]"] .renderer-text').should('have.text', 'Row 1: Eve');
      cy.get('[id="personGreeting[0]"] .renderer-text').should('have.text', 'Row 0: Ada');
    });

    it('should render a renderer only while its include condition is true', () => {
      mountFn({
        formDef: defineForm({
          form: [
            nameInput,
            {
              uid: 'secret',
              kind: 'display',
              type: 'renderer',
              include: { when: "$form.name === 'Ada'" },
              props: { render: renderText('Shown for Ada') },
            },
          ],
        }),
      });

      cy.get('[data-cy="name_textinput"]').should('exist');
      cy.get('[id="secret"]').should('not.exist');
      cy.get('[data-cy="name_textinput"]').type('Ada');
      cy.get('[id="secret"] .renderer-text').should('have.text', 'Shown for Ada');
      cy.get('[data-cy="name_textinput"]').type('x');
      cy.get('[id="secret"]').should('not.exist');
    });

    it('should report a render function that throws in formHealth, and show the renderer again after a recovery', () => {
      mountFn({
        formDef: defineForm({
          form: [
            nameInput,
            (api?: FunctionWidgetParams<any>) => {
              // Throws only after the mount. The call that decodes the form gets an empty $form.
              if (api?.$form.name === 'boom') {
                throw new Error('render failed');
              }
              return {
                uid: 'status',
                kind: 'display',
                type: 'renderer',
                props: { render: renderText(`Name: ${api?.$form.name ?? ''}`) },
              };
            },
          ],
        }),
      });

      cy.get('[id="status"] .renderer-text').should('have.text', 'Name: ');
      cy.get('[data-cy="name_textinput"]').type('boom');
      cy.get('@formHealth').should('have.been.calledWithMatch', {
        status: 'errored',
        code: 11,
        message: '[11] render failed',
      });
      cy.get('[data-cy="name_textinput"]').type('!');
      cy.get('[id="status"] .renderer-text').should('have.text', 'Name: boom!');
      cy.get('@formHealth').its('lastCall.args.0').should('deep.equal', { status: 'ok' });
    });
  });
};
