import { defineForm } from '@golemui/core';
import { type MountComponentFn } from '../utils';

type TestData = {
  myInput: string;
};

export const runReactiveFunctionsComponentTests = (mountFn: MountComponentFn) => {
  describe('Propery Functions', () => {
    it('Should execute property functions on initialize', () => {
      mountFn({
        data: {
          myInput: 'My Label',
        },
        formDef: defineForm<TestData>({
          form: [
            {
              uid: 'propertyFunctionLabel',
              kind: 'input',
              type: 'textinput',
              path: 'myInput',
              label: ({ $form }) => {
                return $form.myInput;
              },
              props: {
                placeholder: ({ $form }: any) => {
                  return $form.myInput === 'My Label'
                    ? 'My Placeholder'
                    : `${$form.myInput} Placeholder`;
                },
              },
            },
          ],
        }),
      });

      cy.get('[data-cy="propertyFunctionLabel_label"]').contains('My Label');
      cy.get('[data-cy="propertyFunctionLabel_textinput"]').should(
        'have.attr',
        'placeholder',
        'My Placeholder',
      );
      cy.get('[data-cy="propertyFunctionLabel_textinput"]').clear();
      cy.get('[data-cy="propertyFunctionLabel_textinput"]').type('New Label');
      cy.get('[data-cy="propertyFunctionLabel_label"]').contains('New Label');
      cy.get('[data-cy="propertyFunctionLabel_textinput"]').should(
        'have.attr',
        'placeholder',
        'New Label Placeholder',
      );
    });
  });

  describe('Field Functions', () => {
    it('Should execute field functions on initialize', () => {
      mountFn({
        data: {
          myInput: 'Hello',
        },
        formDef: defineForm<TestData>({
          form: [
            (api) => ({
              uid: 'propertyFunctionLabel',
              kind: 'input',
              type: 'textinput',
              path: 'myInput',
              label: api?.$form.myInput,
              props: {
                placeholder:
                  api?.$form.myInput === 'Hello'
                    ? 'My Placeholder'
                    : `${api?.$form.myInput} Placeholder`,
              },
            }),
          ],
        }),
      });

      cy.get('[data-cy="propertyFunctionLabel_label"]').contains('Hello');
      cy.get('[data-cy="propertyFunctionLabel_textinput"]').should(
        'have.attr',
        'placeholder',
        'My Placeholder',
      );
      cy.get('[data-cy="propertyFunctionLabel_textinput"]').clear();
      cy.get('[data-cy="propertyFunctionLabel_textinput"]').type('Another Label');
      cy.get('[data-cy="propertyFunctionLabel_label"]').contains('Another Label');
      cy.get('[data-cy="propertyFunctionLabel_textinput"]').should(
        'have.attr',
        'placeholder',
        'Another Label Placeholder',
      );
    });
    it('Should provide the api.touched property as an argument', () => {
      mountFn({
        data: {},
        formDef: defineForm<TestData>({
          form: [
            {
              uid: 'openUid',
              kind: 'input',
              type: 'checkbox',
              label: "Toggle me! I don't trigger input label changes",
              path: 'open',
            },
            (api) => ({
              uid: 'inputUid',
              kind: 'input',
              type: 'textinput',
              path: 'myInput',
              label: api?.touched ? (api?.errors ? 'Has errors!' : 'Ohmmm') : 'Not touched',
              validator: { type: 'string', required: true, minLength: 3 },
            }),
          ],
        }),
      });

      // The checbox doesn't trigger errors on the input because the input is not touched
      cy.get('[data-cy="openUid_checkbox"]').check();
      cy.get('[data-cy="inputUid_label"]').contains('Not touched');
      cy.get('[data-cy="openUid_checkbox"]').uncheck();
      cy.get('[data-cy="inputUid_label"]').contains('Not touched');

      // As soon as we start typing the errors surface
      cy.get('[data-cy="inputUid_textinput"]').type('1');
      cy.get('[data-cy="inputUid_label"]').contains('Has errors!');
      cy.get('[data-cy="inputUid_textinput"]').type('2');
      cy.get('[data-cy="inputUid_label"]').contains('Has errors!');
      cy.get('[data-cy="inputUid_textinput"]').type('3');

      // No more errors because validation passes
      cy.get('[data-cy="inputUid_label"]').contains('Ohmmm');
    });

    it('Should show the errors of a required field function after a submit attempt', () => {
      mountFn({
        data: {},
        formDef: defineForm<TestData>({
          form: [
            () => ({
              uid: 'inputUid',
              kind: 'input',
              type: 'textinput',
              path: 'myInput',
              label: 'My input',
              validator: { type: 'string', required: true },
            }),
            {
              uid: 'submitBtn',
              kind: 'action',
              type: 'button',
              label: 'Submit',
              actionType: 'submit',
            },
          ],
        }),
      });

      cy.get('[data-cy="inputUid_validator-errors"]').should('not.exist');

      // The submit touches every input, so the error shows without interacting with the field.
      cy.get('[data-cy="submitBtn_button"]').click();
      cy.get('[data-cy="inputUid_validator-errors"]').should('exist');
    });
  });
};
