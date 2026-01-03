import * as Core from '@golemui/core';
import * as ValidatorsVanilla from '@golemui/validators-vanilla';
import * as z from 'zod/mini';
import { MountComponentFn } from '../utils';

const allowedNames: ValidatorsVanilla.CustomValidatorSchemaFn = (names: string[]) =>
  z.string().check(
    z.superRefine((val, ctx) => {
      if (names.includes(val) === false) {
        ctx.addIssue({
          code: 'custom',
          message: `Name "${val}" not in ${names.map((name) => `"${name}"`).join(', ')}`,
          input: val,
        });
      }
    }),
  );

export const runValidatorsComponentTests = (mountFn: MountComponentFn) => {
  describe('Validators', () => {
    context('String validators', () => {
      it('should display an error validating required strings on submit', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'requiredString',
                kind: 'control',
                widget: 'textinput',
                path: 'requiredString',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="requiredString_validator-errors"]').should('exist');
        cy.get('[data-cy="requiredString_validator-error"]').contains('Invalid date format');
      });

      // TODO: Fix string validator to validate empty strings as invalid
      it.skip('should display an error validating required strings', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'requiredString',
                kind: 'control',
                widget: 'textinput',
                path: 'requiredString',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="requiredString_validator-input"]').type('a{backspace}');
        cy.get('[data-cy="requiredString_validator-errors"]').should('exist');
        cy.get('[data-cy="requiredString_validator-error"]').contains(
          `Invalid input: expected string, received ''`,
        );
      });

      it('should display an error validating minLength', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'minLength',
                kind: 'control',
                widget: 'textinput',
                path: 'minLength',
                validator: { type: 'string', minLength: 3 },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="minLength_textinput"]').type('abc');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="minLength_validator-errors"]').should('not.exist');

        cy.get('[data-cy="minLength_textinput"]').clear();
        cy.get('[data-cy="minLength_textinput"]').type('ab');
        cy.get('[data-cy="minLength_validator-errors"]').should('exist');
        cy.get('[data-cy="testButton_button"]').click();

        cy.get('[data-cy="minLength_validator-error"]').contains(
          'Too small: expected string to have >=3 characters',
        );
      });

      it('should display an error validating maxLength', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'maxLength',
                kind: 'control',
                widget: 'textinput',
                path: 'maxLength',
                validator: { type: 'string', maxLength: 6 },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="maxLength_textinput"]').type('abcdef');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="maxLength_validator-errors"]').should('not.exist');

        cy.get('[data-cy="maxLength_textinput"]').clear();
        cy.get('[data-cy="maxLength_textinput"]').type('abcdefgh');
        cy.get('[data-cy="maxLength_validator-errors"]').should('exist');
        cy.get('[data-cy="testButton_button"]').click();

        cy.get('[data-cy="maxLength_validator-error"]').contains(
          'Too big: expected string to have <=6 characters',
        );
      });

      it('should display an error validating pattern', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'pattern',
                kind: 'control',
                widget: 'textinput',
                path: 'pattern',
                validator: { type: 'string', pattern: 'CD' },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="pattern_textinput"]').type('abCDef');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="pattern_validator-errors"]').should('not.exist');

        cy.get('[data-cy="pattern_textinput"]').clear();
        cy.get('[data-cy="pattern_textinput"]').type('abcdef');
        cy.get('[data-cy="pattern_validator-errors"]').should('exist');
        cy.get('[data-cy="testButton_button"]').click();

        cy.get('[data-cy="pattern_validator-error"]').contains(
          'Invalid string: must match pattern /CD/',
        );
      });

      it('should display an error validating enum', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'enumString',
                kind: 'control',
                widget: 'textinput',
                path: 'enumString',
                validator: { type: 'string', enum: 'golemui' },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="enumString_textinput"]').type('golem');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="enumString_validator-errors"]').should('not.exist');

        cy.get('[data-cy="enumString_textinput"]').clear();
        cy.get('[data-cy="enumString_textinput"]').type('abc');
        cy.get('[data-cy="enumString_validator-errors"]').should('exist');
        cy.get('[data-cy="testButton_button"]').click();

        cy.get('[data-cy="enumString_validator-error"]').contains('Invalid input');
      });

      it('should display an error validating const', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'const',
                kind: 'control',
                widget: 'textinput',
                path: 'const',
                validator: { type: 'string', const: 'golemui' },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="const_textinput"]').type('golemui');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="const_validator-errors"]').should('not.exist');

        cy.get('[data-cy="const_textinput"]').clear();
        cy.get('[data-cy="const_textinput"]').type('abc');
        cy.get('[data-cy="const_validator-errors"]').should('exist');
        cy.get('[data-cy="testButton_button"]').click();

        cy.get('[data-cy="const_validator-error"]').contains('Invalid input');
      });

      it('should display an error validating format', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'format',
                kind: 'control',
                widget: 'textinput',
                path: 'format',
                validator: { type: 'string', format: 'email' },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="format_textinput"]').type('contact@golemui.com');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="format_validator-errors"]').should('not.exist');

        cy.get('[data-cy="format_textinput"]').clear();
        cy.get('[data-cy="format_textinput"]').type('abc');
        cy.get('[data-cy="format_validator-errors"]').should('exist');
        cy.get('[data-cy="testButton_button"]').click();

        cy.get('[data-cy="format_validator-error"]').contains('Invalid email address');
      });
    });

    context('Number validators', () => {
      it('should display an error validating required numbers on submit', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'requiredNumber',
                kind: 'control',
                widget: 'number',
                path: 'requiredNumber',
                validator: { type: 'number', required: true },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="requiredNumber_validator-errors"]').should('exist');
        cy.get('[data-cy="requiredNumber_validator-error"]').contains(
          'Invalid input: expected number, received undefined',
        );
      });

      it('should display an error validating required numbers', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'requiredNumber',
                kind: 'control',
                widget: 'number',
                path: 'requiredNumber',
                validator: { type: 'number', required: true },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="requiredNumber_number"]').type('1{backspace}');
        cy.get('[data-cy="requiredNumber_validator-errors"]').should('exist');
        cy.get('[data-cy="requiredNumber_validator-error"]').contains(
          'Invalid input: expected number, received NaN',
        );

        cy.get('[data-cy="requiredNumber_number"]').type('1');
        cy.get('[data-cy="requiredNumber_validator-errors"]').should('not.exist');
      });

      it('should display an error validating min number', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'min',
                kind: 'control',
                widget: 'number',
                path: 'min',
                validator: { type: 'number', minimum: 1 },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="min_number"]').type('1');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="min_validator-errors"]').should('not.exist');

        cy.get('[data-cy="min_number"]').clear();
        cy.get('[data-cy="min_number"]').type('0');
        cy.get('[data-cy="min_validator-errors"]').should('exist');
        cy.get('[data-cy="min_validator-error"]').contains('Too small: expected number to be >=1');
      });

      it('should display an error validating max number', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'max',
                kind: 'control',
                widget: 'number',
                path: 'max',
                validator: { type: 'number', maximum: 100 },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="max_number"]').type('100');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="max_validator-errors"]').should('not.exist');

        cy.get('[data-cy="max_number"]').clear();
        cy.get('[data-cy="max_number"]').type('1000');
        cy.get('[data-cy="max_validator-errors"]').should('exist');
        cy.get('[data-cy="max_validator-error"]').contains('Too big: expected number to be <=100');
      });

      it('should display an error validating exclusive minimum number', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'exclusiveMinimum',
                kind: 'control',
                widget: 'number',
                path: 'exclusiveMinimum',
                validator: { type: 'number', exclusiveMinimum: 100 },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="exclusiveMinimum_number"]').type('101');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="exclusiveMinimum_validator-errors"]').should('not.exist');

        cy.get('[data-cy="exclusiveMinimum_number"]').clear();
        cy.get('[data-cy="exclusiveMinimum_number"]').type('100');
        cy.get('[data-cy="exclusiveMinimum_validator-errors"]').should('exist');
        cy.get('[data-cy="exclusiveMinimum_validator-error"]').contains('Invalid input');
      });

      it('should display an error validating exclusive maximum number', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'exclusiveMaximum',
                kind: 'control',
                widget: 'number',
                path: 'exclusiveMaximum',
                validator: { type: 'number', exclusiveMaximum: 100 },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="exclusiveMaximum_number"]').type('99');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="exclusiveMaximum_validator-errors"]').should('not.exist');

        cy.get('[data-cy="exclusiveMaximum_number"]').clear();
        cy.get('[data-cy="exclusiveMaximum_number"]').type('100');
        cy.get('[data-cy="exclusiveMaximum_validator-errors"]').should('exist');
        cy.get('[data-cy="exclusiveMaximum_validator-error"]').contains('Invalid input');
      });

      it('should display an error validating multipleOf number', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'multipleOf',
                kind: 'control',
                widget: 'number',
                path: 'multipleOf',
                validator: { type: 'number', multipleOf: 5 },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="multipleOf_number"]').type('10');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="multipleOf_validator-errors"]').should('not.exist');

        cy.get('[data-cy="multipleOf_number"]').clear();
        cy.get('[data-cy="multipleOf_number"]').type('7');
        cy.get('[data-cy="multipleOf_validator-errors"]').should('exist');
        cy.get('[data-cy="multipleOf_validator-error"]').contains('Invalid input');
      });
    });

    context('Boolean validators', () => {
      it('should display an error validating boolean const', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'boolean',
                kind: 'control',
                widget: 'checkbox',
                path: 'boolean',
                validator: { type: 'boolean', const: true },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="boolean_checkbox"]').click();
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="boolean_validator-errors"]').should('not.exist');

        cy.get('[data-cy="boolean_checkbox"]').click();
        cy.get('[data-cy="boolean_validator-errors"]').should('exist');
        cy.get('[data-cy="boolean_validator-error"]').contains('Invalid input');
      });
    });

    context('Custom validators', () => {
      const validators: ValidatorsVanilla.CustomValidatorSchemas = {
        allowedNames: allowedNames,
      };

      it('should display an error validating a custom validator', () => {
        mountFn({
          formDef: Core.defineForm({
            form: [
              {
                uid: 'allowedNamesCustomValidator',
                kind: 'control',
                widget: 'textinput',
                path: 'allowedNamesCustomValidator',
                validator: { type: 'custom', allowedNames: ['golemui'] },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
          validators: validators,
        });

        cy.get('[data-cy="allowedNamesCustomValidator_textinput"]').type('a');
        cy.get('[data-cy="allowedNamesCustomValidator_validator-errors"]').should('exist');
        cy.get('[data-cy="allowedNamesCustomValidator_validator-error"]').contains(
          'Name "a" not in "golemui"',
        );

        cy.get('[data-cy="allowedNamesCustomValidator_textinput"]').clear();
        cy.get('[data-cy="allowedNamesCustomValidator_textinput"]').type('golemui');
        cy.get('[data-cy="allowedNamesCustomValidator_validator-errors"]').should('not.exist');
      });
    });

    context('Property validateOn', () => {
      it('should validate on blur', () => {
        mountFn({
          validateOn: 'blur',
          formDef: Core.defineForm({
            form: [
              {
                uid: 'pattern',
                kind: 'control',
                widget: 'textinput',
                path: 'pattern',
                defaultValue: 'ab',
                validator: { type: 'string', pattern: 'CD' },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });

        // Validate message doesn't trigger on change
        cy.get('[data-cy="pattern_textinput"]').type('ab');
        cy.get('[data-cy="pattern_validator-errors"]').should('not.exist');

        // Validate message triggers on blur
        cy.get('[data-cy="pattern_textinput"]').blur();
        cy.get('[data-cy="pattern_validator-errors"]').should('exist');

        cy.get('[data-cy="pattern_validator-error"]').contains(
          'Invalid string: must match pattern /CD/',
        );
      });

      it('should validate on change', () => {
        mountFn({
          validateOn: 'change',
          formDef: Core.defineForm({
            form: [
              {
                uid: 'pattern',
                kind: 'control',
                widget: 'textinput',
                path: 'pattern',
                defaultValue: 'ab',
                validator: { type: 'string', pattern: 'CD' },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });

        // Validate message doesn't trigger on blur
        cy.get('[data-cy="pattern_textinput"]').focus();
        cy.get('[data-cy="pattern_textinput"]').blur();
        cy.get('[data-cy="pattern_validator-errors"]').should('not.exist');

        // Validate message triggers on change
        cy.get('[data-cy="pattern_textinput"]').type('c');
        cy.get('[data-cy="pattern_validator-errors"]').should('exist');

        cy.get('[data-cy="pattern_validator-error"]').contains(
          'Invalid string: must match pattern /CD/',
        );
      });

      it('should validate on submit', () => {
        mountFn({
          validateOn: 'submit',
          formDef: Core.defineForm({
            form: [
              {
                uid: 'pattern',
                kind: 'control',
                widget: 'textinput',
                path: 'pattern',
                defaultValue: 'ab',
                validator: { type: 'string', pattern: 'CD' },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });

        // Validate message doesn't trigger on blur
        cy.get('[data-cy="pattern_textinput"]').focus();
        cy.get('[data-cy="pattern_textinput"]').blur();
        cy.get('[data-cy="pattern_validator-errors"]').should('not.exist');

        // Validate message doesn't trigger on change
        cy.get('[data-cy="pattern_textinput"]').type('ab');
        cy.get('[data-cy="pattern_validator-errors"]').should('not.exist');

        // Validate message triggers on submit
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="pattern_validator-errors"]').should('exist');

        cy.get('[data-cy="pattern_validator-error"]').contains(
          'Invalid string: must match pattern /CD/',
        );
      });

      it('should validate eager on blur', () => {
        mountFn({
          validateOn: 'eager',
          formDef: Core.defineForm({
            form: [
              {
                uid: 'pattern',
                kind: 'control',
                widget: 'textinput',
                path: 'pattern',
                defaultValue: 'ab',
                validator: { type: 'string', pattern: 'CD' },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });

        // Validate message triggers on blur
        cy.get('[data-cy="pattern_textinput"]').focus();
        cy.get('[data-cy="pattern_textinput"]').blur();
        cy.get('[data-cy="pattern_validator-errors"]').should('exist');

        cy.get('[data-cy="pattern_validator-error"]').contains(
          'Invalid string: must match pattern /CD/',
        );
      });

      it('should validate eager on change', () => {
        mountFn({
          validateOn: 'eager',
          formDef: Core.defineForm({
            form: [
              {
                uid: 'pattern',
                kind: 'control',
                widget: 'textinput',
                path: 'pattern',
                defaultValue: 'ab',
                validator: { type: 'string', pattern: 'CD' },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });

        // Validate message triggers on change
        cy.get('[data-cy="pattern_textinput"]').type('c');
        cy.get('[data-cy="pattern_validator-errors"]').should('exist');

        cy.get('[data-cy="pattern_validator-error"]').contains(
          'Invalid string: must match pattern /CD/',
        );
      });

      it('should validate eager on submit', () => {
        mountFn({
          validateOn: 'eager',
          formDef: Core.defineForm({
            form: [
              {
                uid: 'pattern',
                kind: 'control',
                widget: 'textinput',
                path: 'pattern',
                defaultValue: 'ab',
                validator: { type: 'string', pattern: 'CD' },
              },
              {
                uid: 'testButton',
                kind: 'interactive',
                widget: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });

        // Validate message triggers on submit
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="pattern_validator-errors"]').should('exist');

        cy.get('[data-cy="pattern_validator-error"]').contains(
          'Invalid string: must match pattern /CD/',
        );
      });
    });
  });
};
