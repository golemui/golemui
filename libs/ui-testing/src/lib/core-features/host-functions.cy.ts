import { defineForm, type ExpressionFunctions, type I18nTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

const hostFunctions: ExpressionFunctions = {
  upper: (value: string) => String(value ?? '').toUpperCase(),
  grandTotal: (items: Array<{ price?: number }> = []) =>
    items.reduce((sum, item) => sum + (item.price ?? 0), 0),
  lineTotal: (item: { quantity?: number; unitPrice?: number } | undefined) =>
    (item?.quantity ?? 0) * (item?.unitPrice ?? 0),
  isEven: (value: number) => Number(value) % 2 === 0,
};

export const runHostFunctionsComponentTests = (mountFn: MountComponentFn) => {
  describe('$fn host functions', () => {
    describe('string interpolation', () => {
      it('should call a host function inside a {{ }} slot', () => {
        mountFn({
          functions: hostFunctions,
          data: { name: 'jane' },
          formDef: defineForm({
            form: [
              {
                uid: 'greeting',
                kind: 'display',
                type: 'alert',
                props: { text: 'Name: {{$fn.upper($form.name)}}' },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Name: JANE');
      });

      it('should re-evaluate the host function when form data changes', () => {
        mountFn({
          functions: hostFunctions,
          data: { name: 'jane' },
          formDef: defineForm({
            form: [
              {
                uid: 'name-input',
                kind: 'input',
                type: 'textinput',
                path: 'name',
              },
              {
                uid: 'greeting',
                kind: 'display',
                type: 'alert',
                props: { text: 'Name: {{$fn.upper($form.name)}}' },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Name: JANE');
        cy.get('[data-cy="name-input_textinput"]').clear().type('john');
        cy.get('.gui-alert [role="alert"]').contains('Name: JOHN');
      });

      it('should pass an array scope argument to a host function', () => {
        mountFn({
          functions: hostFunctions,
          data: { items: [{ price: 10 }, { price: 20 }] },
          formDef: defineForm({
            form: [
              {
                uid: 'total-display',
                kind: 'display',
                type: 'alert',
                props: { text: 'Total: {{$fn.grandTotal($form.items)}}' },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Total: 30');
      });
    });

    describe('i18n translation params', () => {
      it('should evaluate a $fn expression in i18n params', () => {
        const translator: I18nTranslator = {
          lang: 'en-US',
          translate: (key, params) => `Total is ${params?.['total']}`,
          subscribe: () => () => undefined,
        };

        mountFn({
          functions: hostFunctions,
          localization: translator,
          data: { items: [{ price: 10 }, { price: 20 }] },
          formDef: defineForm({
            form: [
              {
                uid: 'total-display',
                kind: 'display',
                type: 'alert',
                props: {
                  text: {
                    key: 'total.summary',
                    params: { total: '$fn.grandTotal($form.items)' },
                  },
                },
              },
            ],
          }),
        });

        cy.get('.gui-alert [role="alert"]').contains('Total is 30');
      });
    });

    describe('include.when / exclude.when', () => {
      it('should toggle include.when visibility from a $fn expression', () => {
        mountFn({
          functions: hostFunctions,
          data: { count: 2 },
          formDef: defineForm({
            form: [
              {
                uid: 'count-input',
                kind: 'input',
                type: 'number',
                path: 'count',
              },
              {
                uid: 'even-message',
                kind: 'display',
                type: 'alert',
                props: { text: 'Count is even' },
                include: { when: '$fn.isEven($form.count)' },
              },
            ],
          }),
        });

        cy.get('[id="even-message"]').should('exist');
        cy.get('[data-cy="count-input_number"]').clear().type('3');
        cy.get('[id="even-message"]').should('not.exist');
      });

      it('should toggle exclude.when visibility from a $fn expression', () => {
        mountFn({
          functions: hostFunctions,
          data: { count: 2 },
          formDef: defineForm({
            form: [
              {
                uid: 'count-input',
                kind: 'input',
                type: 'number',
                path: 'count',
              },
              {
                uid: 'odd-message',
                kind: 'display',
                type: 'alert',
                props: { text: 'Count is odd' },
                exclude: { when: '$fn.isEven($form.count)' },
              },
            ],
          }),
        });

        cy.get('[id="odd-message"]').should('not.exist');
        cy.get('[data-cy="count-input_number"]').clear().type('3');
        cy.get('[id="odd-message"]').should('exist');
      });
    });

    describe('disabled.when / readonly.when', () => {
      it('should disable an input from a $fn when expression', () => {
        mountFn({
          functions: hostFunctions,
          data: { count: 2 },
          formDef: defineForm({
            form: [
              {
                uid: 'count-input',
                kind: 'input',
                type: 'number',
                path: 'count',
              },
              {
                uid: 'guarded-input',
                kind: 'input',
                type: 'textinput',
                path: 'note',
                disabled: { when: '$fn.isEven($form.count)' },
              },
            ],
          }),
        });

        cy.get('[data-cy="guarded-input_textinput"]').should('have.attr', 'disabled');
        cy.get('[data-cy="count-input_number"]').clear().type('3');
        cy.get('[data-cy="guarded-input_textinput"]').should('not.have.attr', 'disabled');
      });

      it('should make an input readonly from a $fn when expression', () => {
        mountFn({
          functions: hostFunctions,
          data: { count: 2 },
          formDef: defineForm({
            form: [
              {
                uid: 'count-input',
                kind: 'input',
                type: 'number',
                path: 'count',
              },
              {
                uid: 'guarded-input',
                kind: 'input',
                type: 'textinput',
                path: 'note',
                readonly: { when: '$fn.isEven($form.count)' },
              },
            ],
          }),
        });

        cy.get('[data-cy="guarded-input_textinput"]').should('have.attr', 'readonly');
        cy.get('[data-cy="count-input_number"]').clear().type('3');
        cy.get('[data-cy="guarded-input_textinput"]').should('not.have.attr', 'readonly');
      });
    });

    describe('state expressions', () => {
      it('should activate a state from a $fn expression', () => {
        mountFn({
          functions: hostFunctions,
          data: { count: 2 },
          formDef: defineForm({
            states: {
              even: '$fn.isEven($form.count)',
            },
            form: [
              {
                uid: 'count-input',
                kind: 'input',
                type: 'number',
                path: 'count',
              },
              {
                uid: 'even-state-message',
                kind: 'display',
                type: 'alert',
                props: { text: 'Even state active' },
                include: { in: ['even'] },
              },
            ],
          }),
        });

        cy.get('[id="even-state-message"]').should('exist');
        cy.get('[data-cy="count-input_number"]').clear().type('3');
        cy.get('[id="even-state-message"]').should('not.exist');
        cy.get('[data-cy="count-input_number"]').clear().type('4');
        cy.get('[id="even-state-message"]').should('exist');
      });
    });

    describe('repeater templates', () => {
      const LINE_ITEMS_PATH = 'lineItems';
      const getRepeaterFormDefinition = () =>
        defineForm({
          form: [
            {
              uid: 'lineItemsRepeater',
              kind: 'input',
              type: 'repeater',
              path: LINE_ITEMS_PATH,
              props: {
                addLabel: 'Add line item',
                removeLabel: 'Remove line item',
                template: {
                  kind: 'layout',
                  type: 'flex',
                  children: [
                    {
                      uid: 'lineQty',
                      kind: 'input',
                      type: 'textinput',
                      path: `${LINE_ITEMS_PATH}.items.quantity`,
                      label: 'Quantity',
                    },
                    {
                      uid: 'lineTotalMd',
                      kind: 'display',
                      type: 'markdownText',
                      props: {
                        md: 'Line {{$index + 1}}: {{$fn.lineTotal($item)}}',
                      },
                    },
                    {
                      uid: 'evenQtyMd',
                      kind: 'display',
                      type: 'markdownText',
                      props: {
                        md: 'Quantity is even',
                      },
                      include: { when: '$fn.isEven($item.quantity)' },
                    },
                  ],
                },
              },
            },
          ],
        });

      it('should combine $fn with $item and $index inside repeater items', () => {
        mountFn({
          functions: hostFunctions,
          data: {
            lineItems: [
              { quantity: 2, unitPrice: 5 },
              { quantity: 3, unitPrice: 10 },
            ],
          },
          formDef: getRepeaterFormDefinition(),
          // The markdown widget renders nothing without a parser; a passthrough
          // parser keeps the test dependency-free.
          dependencies: { markdown: { parse: (markdown: string) => markdown } },
        });

        cy.get('[id="lineTotalMd[0]"]').should('contain.text', 'Line 1: 10');
        cy.get('[id="lineTotalMd[1]"]').should('contain.text', 'Line 2: 30');

        // Editing a row re-evaluates the host function for that row only
        cy.get('[data-cy="lineQty[0]_textinput"]').clear();
        cy.get('[data-cy="lineQty[0]_textinput"]').type('4');
        cy.get('[id="lineTotalMd[0]"]').should('contain.text', 'Line 1: 20');
        cy.get('[id="lineTotalMd[1]"]').should('contain.text', 'Line 2: 30');
      });

      it('should evaluate a $fn include.when per repeater item', () => {
        mountFn({
          functions: hostFunctions,
          data: {
            lineItems: [
              { quantity: 2, unitPrice: 5 },
              { quantity: 3, unitPrice: 10 },
            ],
          },
          formDef: getRepeaterFormDefinition(),
          dependencies: { markdown: { parse: (markdown: string) => markdown } },
        });

        cy.get('[id="evenQtyMd[0]"]').should('exist');
        cy.get('[id="evenQtyMd[1]"]').should('not.exist');
      });
    });

    describe('error path', () => {
      it('should emit formHealth error when calling a $fn name the host did not provide', () => {
        mountFn({
          functions: hostFunctions,
          data: { name: 'jane' },
          formDef: defineForm({
            form: [
              {
                uid: 'broken-display',
                kind: 'display',
                type: 'alert',
                props: { text: '{{$fn.missing($form.name)}}' },
              },
            ],
          }),
        });

        cy.get('@formHealth').should('have.been.calledWithMatch', {
          status: 'errored',
          code: 40,
        });
      });

      it('should emit formHealth error when no functions were configured at all', () => {
        mountFn({
          data: { name: 'jane' },
          formDef: defineForm({
            form: [
              {
                uid: 'broken-display',
                kind: 'display',
                type: 'alert',
                props: { text: '{{$fn.upper($form.name)}}' },
              },
            ],
          }),
        });

        cy.get('@formHealth').should('have.been.calledWithMatch', {
          status: 'errored',
          code: 40,
        });
      });
    });
  });
};
