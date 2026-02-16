import * as Core from '@golemui/core';
import { MountComponentFn } from '../utils';

export const runIncludeExcludeComponentTests = (mountFn: MountComponentFn) => {
  describe('Include.in/Exclude.in fields with boolean values', () => {
    context('include fields', () => {
      it(`control fields should hide/show with include in`, () => {
        mountFn({
          formDef: Core.defineForm({
            states: {
              check1: '$form.check1 === true',
              'check1:check2': '$form.check2 === true',
            },
            form: [
              {
                uid: 'check1',
                kind: 'input',
                type: 'checkbox',
                label: 'Check 1',
                path: 'check1',
                props: {},
              },
              {
                uid: 'check2',
                kind: 'input',
                type: 'checkbox',
                label: 'Check 2',
                path: 'check2',
                props: {},
              },
              {
                uid: 'check1_check2',
                kind: 'input',
                type: 'textinput',
                path: 'textinput',
                props: {},
                include: { in: ['check1:check2'] },
              },
            ],
          }),
        });

        cy.get('[data-cy="check1_check2_textinput"]').should('not.exist');
        cy.get('[data-cy="check1_checkbox"]').click();
        cy.get('[data-cy="check1_check2_textinput"]').should('not.exist');
        cy.get('[data-cy="check2_checkbox"]').click();
        cy.get('[data-cy="check1_check2_textinput"]').should('exist');
      });

      it(`control fields should hide/show with exclude from`, () => {
        mountFn({
          formDef: Core.defineForm({
            states: {
              check1: '$form.check1 === true',
              'check1:check2': '$form.check2 === true',
            },
            form: [
              {
                uid: 'check1',
                kind: 'input',
                type: 'checkbox',
                label: 'Check 1',
                path: 'check1',
                props: {},
              },
              {
                uid: 'check2',
                kind: 'input',
                type: 'checkbox',
                label: 'Check 2',
                path: 'check2',
                props: {},
              },
              {
                uid: 'check1_check2',
                kind: 'input',
                type: 'textinput',
                path: 'textinput',
                props: {},
                exclude: { from: ['check1:check2'] },
              },
            ],
          }),
        });

        cy.get('[data-cy="check1_check2_textinput"]').should('exist');
        cy.get('[data-cy="check1_checkbox"]').click();
        cy.get('[data-cy="check1_check2_textinput"]').should('exist');
        cy.get('[data-cy="check2_checkbox"]').click();
        cy.get('[data-cy="check1_check2_textinput"]').should('not.exist');
      });
    });
  });

  describe('Include.in/Exclude.in fields with number values', () => {
    context('include fields', () => {
      it(`control fields should hide/show with include in`, () => {
        mountFn({
          formDef: Core.defineForm({
            states: {
              number1: '$form.number1 > 10',
              'number1:number2': '$form.number2 < 10',
            },
            form: [
              {
                uid: 'number1',
                kind: 'input',
                type: 'number',
                label: 'Number 1',
                path: 'number1',
                props: {},
              },
              {
                uid: 'number2',
                kind: 'input',
                type: 'number',
                label: 'Number 2',
                path: 'number2',
                props: {},
              },
              {
                uid: 'number1_number2',
                kind: 'input',
                type: 'textinput',
                path: 'textinput',
                props: {},
                include: { in: ['number1:number2'] },
              },
            ],
          }),
        });

        cy.get('[data-cy="number1_number2_textinput"]').should('not.exist');
        cy.get('[data-cy="number1_number"]').type('11');
        cy.get('[data-cy="number1_number2_textinput"]').should('not.exist');
        cy.get('[data-cy="number2_number"]').type('9');
        cy.get('[data-cy="number1_number2_textinput"]').should('exist');
      });

      it(`control fields should hide/show with exclude from`, () => {
        mountFn({
          formDef: Core.defineForm({
            states: {
              number1: '$form.number1 > 10',
              'number1:number2': '$form.number2 < 10',
            },
            form: [
              {
                uid: 'number1',
                kind: 'input',
                type: 'number',
                label: 'Number 1',
                path: 'number1',
                props: {},
              },
              {
                uid: 'number2',
                kind: 'input',
                type: 'number',
                label: 'Number 2',
                path: 'number2',
                props: {},
              },
              {
                uid: 'number1_number2',
                kind: 'input',
                type: 'textinput',
                path: 'textinput',
                props: {},
                exclude: { from: ['number1:number2'] },
              },
            ],
          }),
        });

        cy.get('[data-cy="number1_number2_textinput"]').should('exist');
        cy.get('[data-cy="number1_number"]').type('11');
        cy.get('[data-cy="number1_number2_textinput"]').should('exist');
        cy.get('[data-cy="number2_number"]').type('9');
        cy.get('[data-cy="number1_number2_textinput"]').should('not.exist');
      });
    });
  });

  describe('Include.in/Exclude.in fields with string values', () => {
    context('include fields', () => {
      it(`control fields should hide/show with include in`, () => {
        mountFn({
          formDef: Core.defineForm({
            states: {
              textinput1: '$form.textinput1 === "abc"',
              'textinput1:textinput2': '$form.textinput2 === "def"',
            },
            form: [
              {
                uid: 'textinput1',
                kind: 'input',
                type: 'textinput',
                label: 'Textinput 1',
                path: 'textinput1',
                props: {},
              },
              {
                uid: 'textinput2',
                kind: 'input',
                type: 'textinput',
                label: 'Textinput 2',
                path: 'textinput2',
                props: {},
              },
              {
                uid: 'textinput1_textinput2',
                kind: 'input',
                type: 'textinput',
                path: 'textinput',
                props: {},
                include: { in: ['textinput1:textinput2'] },
              },
            ],
          }),
        });

        cy.get('[data-cy="textinput1_textinput2_textinput"]').should('not.exist');
        cy.get('[data-cy="textinput1_textinput"]').type('abc');
        cy.get('[data-cy="textinput1_textinput2_textinput"]').should('not.exist');
        cy.get('[data-cy="textinput2_textinput"]').type('def');
        cy.get('[data-cy="textinput1_textinput2_textinput"]').should('exist');
      });

      it(`control fields should hide/show with exclude from`, () => {
        mountFn({
          formDef: Core.defineForm({
            states: {
              textinput1: `$form.textinput1 === 'abc'`,
              'textinput1:textinput2': `$form.textinput2 === 'def'`,
            },
            form: [
              {
                uid: 'textinput1',
                kind: 'input',
                type: 'textinput',
                label: 'Textinput 1',
                path: 'textinput1',
                props: {},
              },
              {
                uid: 'textinput2',
                kind: 'input',
                type: 'textinput',
                label: 'Textinput 2',
                path: 'textinput2',
                props: {},
              },
              {
                uid: 'textinput1_textinput2',
                kind: 'input',
                type: 'textinput',
                path: 'textinput',
                props: {},
                exclude: { from: ['textinput1:textinput2'] },
              },
            ],
          }),
        });

        cy.get('[data-cy="textinput1_textinput2_textinput"]').should('exist');
        cy.get('[data-cy="textinput1_textinput"]').type('abc');
        cy.get('[data-cy="textinput1_textinput2_textinput"]').should('exist');
        cy.get('[data-cy="textinput2_textinput"]').type('def');
        cy.get('[data-cy="textinput1_textinput2_textinput"]').should('not.exist');
      });
    });
  });

  describe('Include.when/Exclude.when fields', () => {
    it('should show field when include.when expression is met', () => {
      mountFn({
        formDef: Core.defineForm({
          form: [
            {
              uid: 'toggle',
              kind: 'input',
              type: 'checkbox',
              path: 'showDetails',
              label: 'Show Details',
            },
            {
              uid: 'details',
              kind: 'input',
              type: 'textinput',
              path: 'details',
              label: 'Details',
              include: { when: '$form.showDetails === true' },
            },
          ],
        }),
      });

      cy.get('[data-cy="details_textinput"]').should('not.exist');
      cy.get('[data-cy="toggle_checkbox"]').click();
      cy.get('[data-cy="details_textinput"]').should('exist');
      cy.get('[data-cy="toggle_checkbox"]').click();
      cy.get('[data-cy="details_textinput"]').should('not.exist');
    });

    it('should hide field when exclude.when expression is met', () => {
      mountFn({
        formDef: Core.defineForm({
          form: [
            {
              uid: 'mode',
              kind: 'input',
              type: 'checkbox',
              path: 'isSimple',
              label: 'Simple Mode',
            },
            {
              uid: 'advanced_feature',
              kind: 'input',
              type: 'textinput',
              path: 'advanced',
              label: 'Advanced Setting',
              exclude: { when: '$form.isSimple === true' },
            },
          ],
        }),
      });

      cy.get('[data-cy="advanced_feature_textinput"]').should('exist');
      cy.get('[data-cy="mode_checkbox"]').click();
      cy.get('[data-cy="advanced_feature_textinput"]').should('not.exist');
    });

    it('should evaluate complex expressions involving multiple values', () => {
      mountFn({
        formDef: Core.defineForm({
          form: [
            {
              uid: 'qty',
              kind: 'input',
              type: 'number',
              path: 'quantity',
              label: 'Quantity',
            },
            {
              uid: 'price',
              kind: 'input',
              type: 'number',
              path: 'unitPrice',
              label: 'Price',
            },
            {
              uid: 'warning',
              kind: 'display',
              type: 'alert',
              props: { text: 'High Value Order!' },
              include: { when: '($form.quantity * $form.unitPrice) > 1000' },
            },
          ],
        }),
      });

      cy.get('.gui-alert [role="alert"]').should('not.exist');

      cy.get('[data-cy="qty_number"]').type('10');
      cy.get('[data-cy="price_number"]').type('200'); // Total 2000
      cy.get('.gui-alert [role="alert"]').should('exist');

      cy.get('[data-cy="price_number"]').clear().type('50'); // Total 500
      cy.get('.gui-alert [role="alert"]').should('not.exist');
    });
  });
};
