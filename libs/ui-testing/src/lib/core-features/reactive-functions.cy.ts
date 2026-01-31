import * as Core from '@golemui/core';
import { MountComponentFn } from '../utils';

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
        formDef: Core.defineForm<TestData>({
          form: [
            {
              uid: 'propertyFunctionLabel',
              kind: 'control',
              widget: 'textinput',
              path: 'myInput',
              label: ({ $form }) => {
                return $form.myInput;
              },
              props: {
                placeholder: ({ $form }) => {
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
        formDef: Core.defineForm<TestData>({
          form: [
            (api) => ({
              uid: 'propertyFunctionLabel',
              kind: 'control',
              widget: 'textinput',
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
  });
};
