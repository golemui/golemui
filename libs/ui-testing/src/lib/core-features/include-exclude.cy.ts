import * as Core from '@golemui/core';
import { MountComponentFn } from '../utils';

export const runIncludeExcludeComponentTests = (mountFn: MountComponentFn) => {
  describe('Include/Exclude fields with boolean values', () => {
    context('include fields', () => {
      it(`control fields should hide/show with include in`, () => {
        mountFn(
          Core.defineForm({
            states: {
              check1: '$form.check1 === true',
              'check1:check2': '$form.check2 === true',
            },
            form: [
              {
                uid: 'check1',
                kind: 'control',
                widget: 'checkbox',
                label: 'Check 1',
                path: 'check1',
                props: {},
              },
              {
                uid: 'check2',
                kind: 'control',
                widget: 'checkbox',
                label: 'Check 2',
                path: 'check2',
                props: {},
              },
              {
                uid: 'check1_check2',
                kind: 'control',
                widget: 'textinput',
                path: 'textinput',
                props: {},
                include: { in: ['check1:check2'] },
              },
            ],
          }),
        );

        cy.get('[data-cy="check1_check2_textinput"]').should('not.exist');
        cy.get('[data-cy="check1_checkbox"]').click();
        cy.get('[data-cy="check1_check2_textinput"]').should('not.exist');
        cy.get('[data-cy="check2_checkbox"]').click();
        cy.get('[data-cy="check1_check2_textinput"]').should('exist');
      });

      it(`control fields should hide/show with exclude from`, () => {
        mountFn(
          Core.defineForm({
            states: {
              check1: '$form.check1 === true',
              'check1:check2': '$form.check2 === true',
            },
            form: [
              {
                uid: 'check1',
                kind: 'control',
                widget: 'checkbox',
                label: 'Check 1',
                path: 'check1',
                props: {},
              },
              {
                uid: 'check2',
                kind: 'control',
                widget: 'checkbox',
                label: 'Check 2',
                path: 'check2',
                props: {},
              },
              {
                uid: 'check1_check2',
                kind: 'control',
                widget: 'textinput',
                path: 'textinput',
                props: {},
                exclude: { from: ['check1:check2'] },
              },
            ],
          }),
        );

        cy.get('[data-cy="check1_check2_textinput"]').should('exist');
        cy.get('[data-cy="check1_checkbox"]').click();
        cy.get('[data-cy="check1_check2_textinput"]').should('exist');
        cy.get('[data-cy="check2_checkbox"]').click();
        cy.get('[data-cy="check1_check2_textinput"]').should('not.exist');
      });
    });
  });

  describe('Include/Exclude fields with number values', () => {
    context('include fields', () => {
      it(`control fields should hide/show with include in`, () => {
        mountFn(
          Core.defineForm({
            states: {
              number1: '$form.number1 > 10',
              'number1:number2': '$form.number2 < 10',
            },
            form: [
              {
                uid: 'number1',
                kind: 'control',
                widget: 'number',
                label: 'Number 1',
                path: 'number1',
                props: {},
              },
              {
                uid: 'number2',
                kind: 'control',
                widget: 'number',
                label: 'Number 2',
                path: 'number2',
                props: {},
              },
              {
                uid: 'number1_number2',
                kind: 'control',
                widget: 'textinput',
                path: 'textinput',
                props: {},
                include: { in: ['number1:number2'] },
              },
            ],
          }),
        );

        cy.get('[data-cy="number1_number2_textinput"]').should('not.exist');
        cy.get('[data-cy="number1_number"]').type('11');
        cy.get('[data-cy="number1_number2_textinput"]').should('not.exist');
        cy.get('[data-cy="number2_number"]').type('9');
        cy.get('[data-cy="number1_number2_textinput"]').should('exist');
      });

      it(`control fields should hide/show with exclude from`, () => {
        mountFn(
          Core.defineForm({
            states: {
              number1: '$form.number1 > 10',
              'number1:number2': '$form.number2 < 10',
            },
            form: [
              {
                uid: 'number1',
                kind: 'control',
                widget: 'number',
                label: 'Number 1',
                path: 'number1',
                props: {},
              },
              {
                uid: 'number2',
                kind: 'control',
                widget: 'number',
                label: 'Number 2',
                path: 'number2',
                props: {},
              },
              {
                uid: 'number1_number2',
                kind: 'control',
                widget: 'textinput',
                path: 'textinput',
                props: {},
                exclude: { from: ['number1:number2'] },
              },
            ],
          }),
        );

        cy.get('[data-cy="number1_number2_textinput"]').should('exist');
        cy.get('[data-cy="number1_number"]').type('11');
        cy.get('[data-cy="number1_number2_textinput"]').should('exist');
        cy.get('[data-cy="number2_number"]').type('9');
        cy.get('[data-cy="number1_number2_textinput"]').should('not.exist');
      });
    });
  });

  describe('Include/Exclude fields with string values', () => {
    context('include fields', () => {
      it(`control fields should hide/show with include in`, () => {
        mountFn(
          Core.defineForm({
            states: {
              textinput1: '$form.textinput1 === "abc"',
              'textinput1:textinput2': '$form.textinput2 === "def"',
            },
            form: [
              {
                uid: 'textinput1',
                kind: 'control',
                widget: 'textinput',
                label: 'Textinput 1',
                path: 'textinput1',
                props: {},
              },
              {
                uid: 'textinput2',
                kind: 'control',
                widget: 'textinput',
                label: 'Textinput 2',
                path: 'textinput2',
                props: {},
              },
              {
                uid: 'textinput1_textinput2',
                kind: 'control',
                widget: 'textinput',
                path: 'textinput',
                props: {},
                include: { in: ['textinput1:textinput2'] },
              },
            ],
          }),
        );

        cy.get('[data-cy="textinput1_textinput2_textinput"]').should('not.exist');
        cy.get('[data-cy="textinput1_textinput"]').type('abc');
        cy.get('[data-cy="textinput1_textinput2_textinput"]').should('not.exist');
        cy.get('[data-cy="textinput2_textinput"]').type('def');
        cy.get('[data-cy="textinput1_textinput2_textinput"]').should('exist');
      });

      it(`control fields should hide/show with exclude from`, () => {
        mountFn(
          Core.defineForm({
            states: {
              textinput1: `$form.textinput1 === 'abc'`,
              'textinput1:textinput2': `$form.textinput2 === 'def'`,
            },
            form: [
              {
                uid: 'textinput1',
                kind: 'control',
                widget: 'textinput',
                label: 'Textinput 1',
                path: 'textinput1',
                props: {},
              },
              {
                uid: 'textinput2',
                kind: 'control',
                widget: 'textinput',
                label: 'Textinput 2',
                path: 'textinput2',
                props: {},
              },
              {
                uid: 'textinput1_textinput2',
                kind: 'control',
                widget: 'textinput',
                path: 'textinput',
                props: {},
                exclude: { from: ['textinput1:textinput2'] },
              },
            ],
          }),
        );

        cy.get('[data-cy="textinput1_textinput2_textinput"]').should('exist');
        cy.get('[data-cy="textinput1_textinput"]').type('abc');
        cy.get('[data-cy="textinput1_textinput2_textinput"]').should('exist');
        cy.get('[data-cy="textinput2_textinput"]').type('def');
        cy.get('[data-cy="textinput1_textinput2_textinput"]').should('not.exist');
      });
    });
  });
};
