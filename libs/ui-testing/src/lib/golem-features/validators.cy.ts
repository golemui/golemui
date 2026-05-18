import { type I18nTranslator, defineForm } from '@golemui/core'
import { golemForm } from '@golemui/gui-shared';
import type { CustomValidatorSchemaFn, CustomValidatorSchemas } from '@golemui/gui-validators'
import { string, superRefine } from 'zod/mini'
import { type MountComponentFn } from '../utils';

const allowedNames: CustomValidatorSchemaFn = (names: string[]) =>
  string().check(
    superRefine((val, ctx) => {
      if (val && names.includes(val) === false) {
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
          formDef: defineForm({
            form: [
              {
                uid: 'requiredString',
                kind: 'input',
                type: 'textinput',
                path: 'requiredString',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
        cy.get('[data-cy="requiredString_validator-error"]').contains(
          'Invalid input: expected string, received undefined',
        );
      });

      it('should display an error validating required strings', () => {
        mountFn({
          formDef: defineForm({
            form: [
              {
                uid: 'requiredString',
                kind: 'input',
                type: 'textinput',
                path: 'requiredString',
                validator: { type: 'string', required: true },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('[data-cy="requiredString_textinput"]').type('a{backspace}');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="requiredString_validator-errors"]').should('exist');
        cy.get('[data-cy="requiredString_validator-error"]').contains('This field is required');
      });

      it('should display an error validating minLength', () => {
        mountFn({
          formDef: defineForm({
            form: [
              {
                uid: 'minLength',
                kind: 'input',
                type: 'textinput',
                path: 'minLength',
                validator: { type: 'string', minLength: 3 },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'maxLength',
                kind: 'input',
                type: 'textinput',
                path: 'maxLength',
                validator: { type: 'string', maxLength: 6 },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'pattern',
                kind: 'input',
                type: 'textinput',
                path: 'pattern',
                validator: { type: 'string', pattern: 'CD' },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'enumString',
                kind: 'input',
                type: 'textinput',
                path: 'enumString',
                validator: { type: 'string', enum: 'golemui' },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'const',
                kind: 'input',
                type: 'textinput',
                path: 'const',
                validator: { type: 'string', const: 'golemui' },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'format',
                kind: 'input',
                type: 'textinput',
                path: 'format',
                validator: { type: 'string', format: 'email' },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'requiredNumber',
                kind: 'input',
                type: 'number',
                path: 'requiredNumber',
                validator: { type: 'number', required: true },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'requiredNumber',
                kind: 'input',
                type: 'number',
                path: 'requiredNumber',
                validator: { type: 'number', required: true },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'min',
                kind: 'input',
                type: 'number',
                path: 'min',
                validator: { type: 'number', minimum: 1 },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'max',
                kind: 'input',
                type: 'number',
                path: 'max',
                validator: { type: 'number', maximum: 100 },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'exclusiveMinimum',
                kind: 'input',
                type: 'number',
                path: 'exclusiveMinimum',
                validator: { type: 'number', exclusiveMinimum: 100 },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'exclusiveMaximum',
                kind: 'input',
                type: 'number',
                path: 'exclusiveMaximum',
                validator: { type: 'number', exclusiveMaximum: 100 },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'multipleOf',
                kind: 'input',
                type: 'number',
                path: 'multipleOf',
                validator: { type: 'number', multipleOf: 5 },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'boolean',
                kind: 'input',
                type: 'checkbox',
                path: 'boolean',
                label: 'Boolean',
                validator: { type: 'boolean', const: true },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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

    context('Array validators', () => {
      it('should display an error validating required arrays on submit', () => {
        mountFn({
          formDef: golemForm().create({
            form: [
              {
                uid: 'requiredArray',
                kind: 'input',
                type: 'repeater',
                path: 'requiredArray',
                label: 'Required Array',
                validator: { type: 'array', required: true },
                props: {
                  addLabel: 'Add Item',
                  template: {
                    kind: 'layout',
                    type: 'flex',
                    children: [
                      {
                        uid: 'requiredArray_item',
                        kind: 'input',
                        type: 'textinput',
                        path: 'requiredArray.items.name',
                        label: 'Name',
                      },
                    ],
                  },
                },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('.gui-repeater__add-btn').should('exist');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="requiredArray_validator-errors"]').should('exist');
        cy.get('[data-cy="requiredArray_validator-error"]').contains(
          'Invalid input: expected array, received undefined',
        );

        cy.get('.gui-repeater__add-btn').click();
        cy.get('[data-cy="requiredArray_validator-errors"]').should('not.exist');
      });

      it('should display an error validating minItems', () => {
        mountFn({
          formDef: golemForm().create({
            form: [
              {
                uid: 'minItems',
                kind: 'input',
                type: 'repeater',
                path: 'minItems',
                label: 'Min Items',
                validator: { type: 'array', minItems: 2 },
                props: {
                  addLabel: 'Add Item',
                  template: {
                    kind: 'layout',
                    type: 'flex',
                    children: [
                      {
                        uid: 'minItems_item',
                        kind: 'input',
                        type: 'textinput',
                        path: 'minItems.items.name',
                        label: 'Name',
                      },
                    ],
                  },
                },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('.gui-repeater__add-btn').click();
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="minItems_validator-errors"]').should('exist');
        cy.get('[data-cy="minItems_validator-error"]').contains(
          'Too small: expected array to have >=2 items',
        );

        cy.get('.gui-repeater__add-btn').click();
        cy.get('[data-cy="minItems_validator-errors"]').should('not.exist');
      });

      it('should display an error validating maxItems', () => {
        mountFn({
          formDef: golemForm().create({
            form: [
              {
                uid: 'maxItems',
                kind: 'input',
                type: 'repeater',
                path: 'maxItems',
                label: 'Max Items',
                validator: { type: 'array', maxItems: 2 },
                props: {
                  addLabel: 'Add Item',
                  template: {
                    kind: 'layout',
                    type: 'flex',
                    children: [
                      {
                        uid: 'maxItems_item',
                        kind: 'input',
                        type: 'textinput',
                        path: 'maxItems.items.name',
                        label: 'Name',
                      },
                    ],
                  },
                },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
                label: 'Test',
                on: {
                  click: 'submit',
                },
              },
            ],
          }),
        });
        cy.get('.gui-repeater__add-btn').click();
        cy.get('.gui-repeater__add-btn').click();
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="maxItems_validator-errors"]').should('not.exist');

        cy.get('.gui-repeater__add-btn').click();
        cy.get('[data-cy="maxItems_validator-errors"]').should('exist');
        cy.get('[data-cy="maxItems_validator-error"]').contains(
          'Too big: expected array to have <=2 items',
        );
      });
    });

    context('Custom validators', () => {
      const validators: CustomValidatorSchemas = {
        allowedNames: allowedNames,
      };

      it('should display an error validating a custom validator', () => {
        mountFn({
          formDef: defineForm({
            form: [
              {
                uid: 'allowedNamesCustomValidator',
                kind: 'input',
                type: 'textinput',
                path: 'allowedNamesCustomValidator',
                validator: { type: 'custom', allowedNames: ['golemui'] },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'pattern',
                kind: 'input',
                type: 'textinput',
                path: 'pattern',
                defaultValue: 'ab',
                validator: { type: 'string', pattern: 'CD' },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'pattern',
                kind: 'input',
                type: 'textinput',
                path: 'pattern',
                defaultValue: 'ab',
                validator: { type: 'string', pattern: 'CD' },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'pattern',
                kind: 'input',
                type: 'textinput',
                path: 'pattern',
                defaultValue: 'ab',
                validator: { type: 'string', pattern: 'CD' },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'pattern',
                kind: 'input',
                type: 'textinput',
                path: 'pattern',
                defaultValue: 'ab',
                validator: { type: 'string', pattern: 'CD' },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'pattern',
                kind: 'input',
                type: 'textinput',
                path: 'pattern',
                defaultValue: 'ab',
                validator: { type: 'string', pattern: 'CD' },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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
          formDef: defineForm({
            form: [
              {
                uid: 'pattern',
                kind: 'input',
                type: 'textinput',
                path: 'pattern',
                defaultValue: 'ab',
                validator: { type: 'string', pattern: 'CD' },
              },
              {
                uid: 'testButton',
                kind: 'action',
                type: 'button',
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

    context('Custom messages', () => {
      const makeTranslator = (translations: Record<string, string>): I18nTranslator => ({
        get lang() {
          return 'en';
        },
        translate(key: string, _params?: unknown, defaultValue?: string) {
          return translations[key] ?? defaultValue ?? key;
        },
        subscribe() {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return function unsubscribe() {};
        },
      });

      context('String validators', () => {
        it('should show custom message for required', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'username',
                  kind: 'input',
                  type: 'textinput',
                  path: 'username',
                  validator: {
                    type: 'string',
                    required: true,
                    messages: { required: 'Username is required' },
                  },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
          });
          cy.get('[data-cy="username_textinput"]').type('a{backspace}');
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="username_validator-errors"]').should('exist');
          cy.get('[data-cy="username_validator-error"]').contains('Username is required');
        });

        it('should show custom message for minLength', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'username',
                  kind: 'input',
                  type: 'textinput',
                  path: 'username',
                  validator: {
                    type: 'string',
                    minLength: 4,
                    messages: { minLength: 'Username must be at least 4 characters' },
                  },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
          });
          cy.get('[data-cy="username_textinput"]').type('abcd');
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="username_validator-errors"]').should('not.exist');

          cy.get('[data-cy="username_textinput"]').clear();
          cy.get('[data-cy="username_textinput"]').type('ab');
          cy.get('[data-cy="username_validator-errors"]').should('exist');
          cy.get('[data-cy="username_validator-error"]').contains(
            'Username must be at least 4 characters',
          );
        });

        it('should show custom message for maxLength', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'username',
                  kind: 'input',
                  type: 'textinput',
                  path: 'username',
                  validator: {
                    type: 'string',
                    maxLength: 10,
                    messages: { maxLength: 'Username must be 10 characters or fewer' },
                  },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
          });
          cy.get('[data-cy="username_textinput"]').type('1234567890');
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="username_validator-errors"]').should('not.exist');

          cy.get('[data-cy="username_textinput"]').clear();
          cy.get('[data-cy="username_textinput"]').type('12345678901');
          cy.get('[data-cy="username_validator-errors"]').should('exist');
          cy.get('[data-cy="username_validator-error"]').contains(
            'Username must be 10 characters or fewer',
          );
        });

        it('should show translated message for pattern (TranslationConfig)', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'zipCode',
                  kind: 'input',
                  type: 'textinput',
                  path: 'zipCode',
                  validator: {
                    type: 'string',
                    pattern: '^\\d{5}$',
                    messages: { pattern: { key: 'validation.zipCode.pattern' } },
                  },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
            localization: makeTranslator({
              'validation.zipCode.pattern': 'ZIP code must be exactly 5 digits',
            }),
          });
          cy.get('[data-cy="zipCode_textinput"]').type('12345');
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="zipCode_validator-errors"]').should('not.exist');

          cy.get('[data-cy="zipCode_textinput"]').clear();
          cy.get('[data-cy="zipCode_textinput"]').type('1234');
          cy.get('[data-cy="zipCode_validator-errors"]').should('exist');
          cy.get('[data-cy="zipCode_validator-error"]').contains(
            'ZIP code must be exactly 5 digits',
          );
        });

        it('should show translated message for format (TranslationConfig)', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'website',
                  kind: 'input',
                  type: 'textinput',
                  path: 'website',
                  validator: {
                    type: 'string',
                    format: 'url',
                    messages: { format: { key: 'validation.website.format' } },
                  },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
            localization: makeTranslator({
              'validation.website.format': 'Please enter a valid URL',
            }),
          });
          cy.get('[data-cy="website_textinput"]').type('https://golemui.com');
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="website_validator-errors"]').should('not.exist');

          cy.get('[data-cy="website_textinput"]').clear();
          cy.get('[data-cy="website_textinput"]').type('not-a-url');
          cy.get('[data-cy="website_validator-errors"]').should('exist');
          cy.get('[data-cy="website_validator-error"]').contains('Please enter a valid URL');
        });
      });

      context('Number validators', () => {
        it('should show custom invalid message when value is not a number', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'age',
                  kind: 'input',
                  type: 'number',
                  path: 'age',
                  validator: {
                    type: 'number',
                    required: true,
                    messages: { invalid: 'Age must be a number' },
                  },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
          });
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="age_validator-errors"]').should('exist');
          cy.get('[data-cy="age_validator-error"]').contains('Age must be a number');
        });

        it('should show custom message for minimum', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'age',
                  kind: 'input',
                  type: 'number',
                  path: 'age',
                  validator: {
                    type: 'number',
                    minimum: 18,
                    messages: { minimum: 'You must be at least 18 years old' },
                  },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
          });
          cy.get('[data-cy="age_number"]').type('18');
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="age_validator-errors"]').should('not.exist');

          cy.get('[data-cy="age_number"]').clear();
          cy.get('[data-cy="age_number"]').type('17');
          cy.get('[data-cy="age_validator-errors"]').should('exist');
          cy.get('[data-cy="age_validator-error"]').contains('You must be at least 18 years old');
        });

        it('should show custom message for maximum', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'age',
                  kind: 'input',
                  type: 'number',
                  path: 'age',
                  validator: {
                    type: 'number',
                    maximum: 120,
                    messages: { maximum: 'Age cannot exceed 120' },
                  },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
          });
          cy.get('[data-cy="age_number"]').type('120');
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="age_validator-errors"]').should('not.exist');

          cy.get('[data-cy="age_number"]').clear();
          cy.get('[data-cy="age_number"]').type('121');
          cy.get('[data-cy="age_validator-errors"]').should('exist');
          cy.get('[data-cy="age_validator-error"]').contains('Age cannot exceed 120');
        });

        it('should show translated message for exclusiveMinimum (TranslationConfig)', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'score',
                  kind: 'input',
                  type: 'number',
                  path: 'score',
                  validator: {
                    type: 'number',
                    exclusiveMinimum: 0,
                    messages: {
                      exclusiveMinimum: { key: 'validation.score.exclusiveMinimum' },
                    },
                  },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
            localization: makeTranslator({
              'validation.score.exclusiveMinimum': 'Score must be greater than 0',
            }),
          });
          cy.get('[data-cy="score_number"]').type('1');
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="score_validator-errors"]').should('not.exist');

          cy.get('[data-cy="score_number"]').clear();
          cy.get('[data-cy="score_number"]').type('0');
          cy.get('[data-cy="score_validator-errors"]').should('exist');
          cy.get('[data-cy="score_validator-error"]').contains('Score must be greater than 0');
        });

        it('should show translated message for exclusiveMaximum (TranslationConfig)', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'score',
                  kind: 'input',
                  type: 'number',
                  path: 'score',
                  validator: {
                    type: 'number',
                    exclusiveMaximum: 100,
                    messages: {
                      exclusiveMaximum: { key: 'validation.score.exclusiveMaximum' },
                    },
                  },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
            localization: makeTranslator({
              'validation.score.exclusiveMaximum': 'Score must be less than 100',
            }),
          });
          cy.get('[data-cy="score_number"]').type('99');
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="score_validator-errors"]').should('not.exist');

          cy.get('[data-cy="score_number"]').clear();
          cy.get('[data-cy="score_number"]').type('100');
          cy.get('[data-cy="score_validator-errors"]').should('exist');
          cy.get('[data-cy="score_validator-error"]').contains('Score must be less than 100');
        });

        it('should show custom message for multipleOf', () => {
          mountFn({
            formDef: golemForm().create({
              form: [
                {
                  uid: 'rating',
                  kind: 'input',
                  type: 'number',
                  path: 'rating',
                  validator: {
                    type: 'number',
                    multipleOf: 0.5,
                    messages: { multipleOf: 'Rating must be a multiple of 0.5' },
                  },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
          });
          cy.get('[data-cy="rating_number"]').type('1');
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="rating_validator-errors"]').should('not.exist');

          cy.get('[data-cy="rating_number"]').clear();
          cy.get('[data-cy="rating_number"]').type('7.2');
          cy.get('[data-cy="rating_validator-errors"]').should('exist');
          cy.get('[data-cy="rating_validator-error"]').contains('Rating must be a multiple of 0.5');
        });
      });

      context('Boolean validators', () => {
        it('should show custom invalid message when value is not a boolean', () => {
          mountFn({
            data: { acceptTerms: null },
            formDef: defineForm({
              form: [
                {
                  uid: 'acceptTerms',
                  kind: 'input',
                  type: 'checkbox',
                  path: 'acceptTerms',
                  label: 'Accept terms',
                  validator: {
                    type: 'boolean',
                    const: true,
                    messages: {
                      invalid: 'You must check',
                      const: 'You must accept the terms and conditions to continue',
                    },
                  },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
          });
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="acceptTerms_validator-errors"]').should('exist');
          cy.get('[data-cy="acceptTerms_validator-error"]').contains('You must check');
        });

        it('should show custom const message when value is false', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'acceptTerms',
                  kind: 'input',
                  type: 'checkbox',
                  path: 'acceptTerms',
                  label: 'Accept terms',
                  validator: {
                    type: 'boolean',
                    const: true,
                    messages: {
                      invalid: 'You must check',
                      const: 'You must accept the terms and conditions to continue',
                    },
                  },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
          });
          cy.get('[data-cy="acceptTerms_checkbox"]').click(); // check -> true -> valid
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="acceptTerms_validator-errors"]').should('not.exist');

          cy.get('[data-cy="acceptTerms_checkbox"]').click(); // uncheck -> false -> const fails
          cy.get('[data-cy="acceptTerms_validator-errors"]').should('exist');
          cy.get('[data-cy="acceptTerms_validator-error"]').contains(
            'You must accept the terms and conditions to continue',
          );
        });
      });

      context('Array validators', () => {
        const repeaterTemplate = {
          kind: 'layout' as const,
          type: 'flex' as const,
          children: [
            {
              uid: 'item_name',
              kind: 'input' as const,
              type: 'textinput' as const,
              path: 'tags.items.name',
              label: 'Name',
            },
          ],
        };

        it('should show translated message for required array (TranslationConfig)', () => {
          mountFn({
            data: { tags: [] },
            formDef: golemForm().create({
              form: [
                {
                  uid: 'tags',
                  kind: 'input',
                  type: 'repeater',
                  path: 'tags',
                  label: 'Tags',
                  validator: {
                    type: 'array',
                    required: true,
                    messages: { required: { key: 'validation.tags.required' } },
                  },
                  props: { addLabel: 'Add Tag', template: repeaterTemplate },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
            localization: makeTranslator({
              'validation.tags.required': 'Please select at least one tag',
            }),
          });
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="tags_validator-errors"]').should('exist');
          cy.get('[data-cy="tags_validator-error"]').contains('Please select at least one tag');
        });

        it('should show translated message for minItems (TranslationConfig)', () => {
          mountFn({
            formDef: golemForm().create({
              form: [
                {
                  uid: 'tags',
                  kind: 'input',
                  type: 'repeater',
                  path: 'tags',
                  label: 'Tags',
                  validator: {
                    type: 'array',
                    minItems: 2,
                    messages: { minItems: { key: 'validation.tags.minItems' } },
                  },
                  props: { addLabel: 'Add Tag', template: repeaterTemplate },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
            localization: makeTranslator({
              'validation.tags.minItems': 'Please select at least 2 tags',
            }),
          });
          cy.get('.gui-repeater__add-btn').click();
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="tags_validator-errors"]').should('exist');
          cy.get('[data-cy="tags_validator-error"]').contains('Please select at least 2 tags');
        });

        it('should show custom message for maxItems', () => {
          mountFn({
            formDef: golemForm().create({
              form: [
                {
                  uid: 'tags',
                  kind: 'input',
                  type: 'repeater',
                  path: 'tags',
                  label: 'Tags',
                  validator: {
                    type: 'array',
                    maxItems: 2,
                    messages: { maxItems: 'You can select at most 2 tags' },
                  },
                  props: { addLabel: 'Add Tag', template: repeaterTemplate },
                },
                {
                  uid: 'testButton',
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  on: { click: 'submit' },
                },
              ],
            }),
          });
          cy.get('.gui-repeater__add-btn').click();
          cy.get('.gui-repeater__add-btn').click();
          cy.get('[data-cy="testButton_button"]').click();
          cy.get('[data-cy="tags_validator-errors"]').should('not.exist');

          cy.get('.gui-repeater__add-btn').click();
          cy.get('[data-cy="tags_validator-errors"]').should('exist');
          cy.get('[data-cy="tags_validator-error"]').contains('You can select at most 2 tags');
        });
      });
    });
  });
};
