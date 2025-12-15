export const runValidatorsComponentTests = (mountFn: (formDef: Record<string, any>) => void) => {
  describe('Validators', () => {
    beforeEach(() => {
      mountFn({
        form: [
          {
            uid: 'requiredString',
            kind: 'control',
            widget: 'textinput',
            path: 'requiredString',
            validator: { type: 'string', required: true },
          },
          {
            uid: 'minLength',
            kind: 'control',
            widget: 'textinput',
            path: 'minLength',
            validator: { type: 'string', minLength: 3 },
          },
          {
            uid: 'maxLength',
            kind: 'control',
            widget: 'textinput',
            path: 'maxLength',
            validator: { type: 'string', maxLength: 6 },
          },
          {
            uid: 'pattern',
            kind: 'control',
            widget: 'textinput',
            path: 'pattern',
            validator: { type: 'string', pattern: 'CD' },
          },
          {
            uid: 'enumString',
            kind: 'control',
            widget: 'textinput',
            path: 'enumString',
            validator: { type: 'string', enum: 'golemui' },
          },
          {
            uid: 'const',
            kind: 'control',
            widget: 'textinput',
            path: 'const',
            validator: { type: 'string', const: 'golemui' },
          },
          {
            uid: 'format',
            kind: 'control',
            widget: 'textinput',
            path: 'format',
            validator: { type: 'string', format: 'email' },
          },
          {
            uid: 'requiredNumber',
            kind: 'control',
            widget: 'number',
            path: 'requiredNumber',
            validator: { type: 'number', required: true },
          },
          {
            uid: 'min',
            kind: 'control',
            widget: 'number',
            path: 'min',
            validator: { type: 'number', minimum: 1 },
          },
          {
            uid: 'max',
            kind: 'control',
            widget: 'number',
            path: 'max',
            validator: { type: 'number', maximum: 100 },
          },
          {
            uid: 'exclusiveMinimum',
            kind: 'control',
            widget: 'number',
            path: 'exclusiveMinimum',
            validator: { type: 'number', exclusiveMinimum: 100 },
          },
          {
            uid: 'exclusiveMaximum',
            kind: 'control',
            widget: 'number',
            path: 'exclusiveMaximum',
            validator: { type: 'number', exclusiveMaximum: 100 },
          },
          {
            uid: 'multipleOf',
            kind: 'control',
            widget: 'number',
            path: 'multipleOf',
            validator: { type: 'number', multipleOf: 5 },
          },
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
      });
    });

    context('String validators', () => {
      it('should display an error validating required strings on submit', () => {
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="requiredString_validator-errors"]').should('exist');
        cy.get('[data-cy="requiredString_validator-error"]').contains(
          'Invalid input: expected string, received undefined',
        );
      });

      // TODO: Fix string validator to validate empty strings as invalid
      it.skip('should display an error validating required strings', () => {
        cy.get('[data-cy="requiredString_validator-input"]').type('a{backspace}');
        cy.get('[data-cy="requiredString_validator-errors"]').should('exist');
        cy.get('[data-cy="requiredString_validator-error"]').contains(
          `Invalid input: expected string, received ''`,
        );
      });

      it('should display an error validating minLength', () => {
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
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="requiredNumber_validator-errors"]').should('exist');
        cy.get('[data-cy="requiredNumber_validator-error"]').contains(
          'Invalid input: expected number, received undefined',
        );
      });

      it('should display an error validating required numbers', () => {
        cy.get('[data-cy="requiredNumber_number"]').type('1{backspace}');
        cy.get('[data-cy="requiredNumber_validator-errors"]').should('exist');
        cy.get('[data-cy="requiredNumber_validator-error"]').contains(
          'Invalid input: expected number, received NaN',
        );

        cy.get('[data-cy="requiredNumber_number"]').type('1');
        cy.get('[data-cy="requiredNumber_validator-errors"]').should('not.exist');
      });

      it('should display an error validating min number', () => {
        cy.get('[data-cy="min_number"]').type('1');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="min_validator-errors"]').should('not.exist');

        cy.get('[data-cy="min_number"]').clear();
        cy.get('[data-cy="min_number"]').type('0');
        cy.get('[data-cy="min_validator-errors"]').should('exist');
        cy.get('[data-cy="min_validator-error"]').contains('Too small: expected number to be >=1');
      });

      it('should display an error validating max number', () => {
        cy.get('[data-cy="max_number"]').type('100');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="max_validator-errors"]').should('not.exist');

        cy.get('[data-cy="max_number"]').clear();
        cy.get('[data-cy="max_number"]').type('1000');
        cy.get('[data-cy="max_validator-errors"]').should('exist');
        cy.get('[data-cy="max_validator-error"]').contains('Too big: expected number to be <=100');
      });

      it('should display an error validating exclusive minimum number', () => {
        cy.get('[data-cy="exclusiveMinimum_number"]').type('101');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="exclusiveMinimum_validator-errors"]').should('not.exist');

        cy.get('[data-cy="exclusiveMinimum_number"]').clear();
        cy.get('[data-cy="exclusiveMinimum_number"]').type('100');
        cy.get('[data-cy="exclusiveMinimum_validator-errors"]').should('exist');
        cy.get('[data-cy="exclusiveMinimum_validator-error"]').contains('Invalid input');
      });

      it('should display an error validating exclusive maximum number', () => {
        cy.get('[data-cy="exclusiveMaximum_number"]').type('99');
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="exclusiveMaximum_validator-errors"]').should('not.exist');

        cy.get('[data-cy="exclusiveMaximum_number"]').clear();
        cy.get('[data-cy="exclusiveMaximum_number"]').type('100');
        cy.get('[data-cy="exclusiveMaximum_validator-errors"]').should('exist');
        cy.get('[data-cy="exclusiveMaximum_validator-error"]').contains('Invalid input');
      });

      it('should display an error validating multipleOf number', () => {
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
        cy.get('[data-cy="boolean_checkbox"]').click();
        cy.get('[data-cy="testButton_button"]').click();
        cy.get('[data-cy="boolean_validator-errors"]').should('not.exist');

        cy.get('[data-cy="boolean_checkbox"]').click();
        cy.get('[data-cy="boolean_validator-errors"]').should('exist');
        cy.get('[data-cy="boolean_validator-error"]').contains('Invalid input');
      });
    });
  });
};
