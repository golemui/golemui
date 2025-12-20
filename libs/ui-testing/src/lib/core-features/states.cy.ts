import * as Core from '@golemui/core';
import { MountComponentFn } from '../utils';

export const runStatesComponentTests = (mountFn: MountComponentFn) => {
  describe('States', () => {
    context('Validators with boolean values', () => {
      it(`should add a validator with a state`, () => {
        mountFn({
          formDef: Core.defineForm({
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
                validator: { type: 'string', pattern: 'ab' },
                'validator.check1': { type: 'string', pattern: 'cd' },
                'validator.check1:check2': { type: 'string', pattern: 'ef' },
              },
            ],
          }),
        });

        cy.get('[data-cy="check1_check2_textinput"]').type('a');
        cy.get('[data-cy="check1_check2_validator-errors"]').should('exist');
        cy.get('[data-cy="check1_check2_validator-error"]').contains(
          'Invalid string: must match pattern /ab/',
        );

        cy.get('[data-cy="check1_check2_textinput"]').type('b');
        cy.get('[data-cy="check1_check2_validator-errors"]').should('not.exist');

        cy.get('[data-cy="check1_checkbox"]').click();
        cy.get('[data-cy="check1_check2_validator-errors"]').should('exist');
        cy.get('[data-cy="check1_check2_validator-error"]').contains(
          'Invalid string: must match pattern /cd/',
        );

        cy.get('[data-cy="check1_check2_textinput"]').type('cd');
        cy.get('[data-cy="check1_check2_validator-errors"]').should('not.exist');

        cy.get('[data-cy="check2_checkbox"]').click();
        cy.get('[data-cy="check1_check2_validator-errors"]').should('exist');
        cy.get('[data-cy="check1_check2_validator-error"]').contains(
          'Invalid string: must match pattern /ef/',
        );

        cy.get('[data-cy="check1_check2_textinput"]').type('ef');
        cy.get('[data-cy="check1_check2_validator-errors"]').should('not.exist');
      });
    });

    context('Validators with number values', () => {
      it(`should add a validator with a state`, () => {
        mountFn({
          formDef: Core.defineForm({
            states: {
              number1: '$form.number1 > 10',
              number2: '$form.number2 < 20',
              'number1:combined': '$form.number2 < 20',
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
                widget: 'number',
                path: 'number',
                props: {},
                validator: { type: 'number', required: true },
                'validator.number1': { type: 'number', required: true, minimum: 10 },
                'validator.number2': { type: 'number', required: true, maximum: 20 },
                'validator.number1:combined': {
                  type: 'number',
                  required: true,
                  minimum: 10,
                  maximum: 20,
                },
              },
            ],
          }),
        });

        // input is required
        cy.get('[data-cy="number1_number2_number"]').focus();
        cy.get('[data-cy="number1_number2_number"]').blur();
        cy.get('[data-cy="number1_number2_validator-errors"]').should('exist');
        cy.get('[data-cy="number1_number2_validator-error"]').contains(
          'Invalid input: expected number, received undefined',
        );

        // input passes required validation
        cy.get('[data-cy="number1_number2_number"]').type('1');
        cy.get('[data-cy="number1_number2_validator-errors"]').should('not.exist');

        // add min: 10 validator, input triggers "minimum: 10" validation
        cy.get('[data-cy="number1_number"]').type('11');
        cy.get('[data-cy="number1_number2_validator-errors"]').should('exist');
        cy.get('[data-cy="number1_number2_validator-error"]').contains(
          'Too small: expected number to be >=10',
        );

        // input passes "minimum: 10" validation
        cy.get('[data-cy="number1_number2_number"]').type('1');
        cy.get('[data-cy="number1_number2_validator-errors"]').should('not.exist');

        // add "maximum: 20" validator, remove "minimum: 10" validator
        cy.get('[data-cy="number1_number"]').clear();
        cy.get('[data-cy="number2_number"]').type('11');
        cy.get('[data-cy="number1_number2_number"]').type('cd');
        cy.get('[data-cy="number1_number2_validator-errors"]').should('not.exist');

        // input triggers "maximum: 20" validation
        cy.get('[data-cy="number1_number2_number"]').type('1');
        cy.get('[data-cy="number1_number2_validator-errors"]').should('exist');
        cy.get('[data-cy="number1_number2_validator-error"]').contains(
          'Too big: expected number to be <=20',
        );

        // input passes "maximum: 20" validation
        cy.get('[data-cy="number1_number2_number"]').clear();
        cy.get('[data-cy="number1_number2_number"]').type('1');
        cy.get('[data-cy="number1_number2_validator-errors"]').should('not.exist');

        // add min: 10 validator, input triggers "minimum: 10" validation
        cy.get('[data-cy="number1_number"]').type('11');
        cy.get('[data-cy="number1_number2_validator-errors"]').should('exist');
        cy.get('[data-cy="number1_number2_validator-error"]').contains(
          'Too small: expected number to be >=10',
        );

        // input passes "minimum: 10" validation
        cy.get('[data-cy="number1_number2_number"]').type('1');
        cy.get('[data-cy="number1_number2_validator-errors"]').should('not.exist');
      });
    });

    context('Validators with string values', () => {
      it(`control fields should hide/show with include in`, () => {
        mountFn({
          formDef: Core.defineForm({
            states: {
              textinput1: '$form.textinput1 === "abc"',
              textinput2: '$form.textinput2 === "def"',
              'textinput1:combined': '$form.textinput2 === "bbb"',
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
                validator: { type: 'string', required: true },
                'validator.textinput1': { type: 'string', required: true, pattern: 'abc' },
                'validator.textinput2': { type: 'string', required: true, pattern: 'def' },
                'validator.textinput1:combined': {
                  type: 'string',
                  required: true,
                  pattern: 'aaabbb',
                },
              },
            ],
          }),
        });

        // input is required
        cy.get('[data-cy="textinput1_textinput2_textinput"]').focus();
        cy.get('[data-cy="textinput1_textinput2_textinput"]').blur();
        cy.get('[data-cy="textinput1_textinput2_validator-errors"]').should('exist');
        cy.get('[data-cy="textinput1_textinput2_validator-error"]').contains(
          'Invalid input: expected string, received undefined',
        );

        // input passes required validation
        cy.get('[data-cy="textinput1_textinput2_textinput"]').type('ab');
        cy.get('[data-cy="textinput1_textinput2_validator-errors"]').should('not.exist');

        // add "pattern: abc" validator, input triggers "pattern: abc" validation
        cy.get('[data-cy="textinput1_textinput"]').type('abc');
        cy.get('[data-cy="textinput1_textinput2_validator-errors"]').should('exist');
        cy.get('[data-cy="textinput1_textinput2_validator-error"]').contains(
          'Invalid string: must match pattern /abc/',
        );

        // input passes "pattern: abc" validation
        cy.get('[data-cy="textinput1_textinput2_textinput"]').type('c');
        cy.get('[data-cy="textinput1_textinput2_validator-errors"]').should('not.exist');

        // add "pattern: def" validator, remove "pattern: abc" validator
        cy.get('[data-cy="textinput1_textinput"]').clear();
        cy.get('[data-cy="textinput2_textinput"]').type('def');
        cy.get('[data-cy="textinput1_textinput2_textinput"]').type('def');
        cy.get('[data-cy="textinput1_textinput2_validator-errors"]').should('not.exist');

        // input triggers "pattern: def" validation
        cy.get('[data-cy="textinput1_textinput2_textinput"]').clear();
        cy.get('[data-cy="textinput1_textinput2_textinput"]').type('d');
        cy.get('[data-cy="textinput1_textinput2_validator-errors"]').should('exist');
        cy.get('[data-cy="textinput1_textinput2_validator-error"]').contains(
          'Invalid string: must match pattern /def/',
        );

        // input passes "pattern: def" validation
        cy.get('[data-cy="textinput1_textinput2_textinput"]').clear();
        cy.get('[data-cy="textinput1_textinput2_textinput"]').type('def');
        cy.get('[data-cy="textinput1_textinput2_validator-errors"]').should('not.exist');

        // add "pattern: aaabbb" validator, input triggers "pattern: aaabbb" validation
        cy.get('[data-cy="textinput1_textinput"]').clear();
        cy.get('[data-cy="textinput1_textinput"]').type('abc');
        cy.get('[data-cy="textinput2_textinput"]').clear();
        cy.get('[data-cy="textinput2_textinput"]').type('bbb');
        cy.get('[data-cy="textinput1_textinput2_validator-errors"]').should('exist');
        cy.get('[data-cy="textinput1_textinput2_validator-error"]').contains(
          'Invalid string: must match pattern /aaabbb/',
        );

        // input passes "pattern: aaabbb" validation
        cy.get('[data-cy="textinput1_textinput2_textinput"]').clear();
        cy.get('[data-cy="textinput1_textinput2_textinput"]').type('aaabbb');
        cy.get('[data-cy="textinput1_textinput2_validator-errors"]').should('not.exist');
      });
    });
  });
};
