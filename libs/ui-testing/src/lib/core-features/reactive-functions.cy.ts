import { MountComponentFn } from '../utils';
import * as Core from '@golemui/core';

type TestData = {
  myInput: string;
};

export const runReactiveFunctionsComponentTests = (mountFn: MountComponentFn) => {
  describe('Reactive Functions', () => {
    it('Should execute reactive functions on initialize', () => {
      mountFn({
        data: {
          myInput: 'My Label',
        },
        formDef: Core.defineForm<TestData>({
          form: [
            {
              uid: 'reactiveFunctionLabel',
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

      cy.get('[data-cy="reactiveFunctionLabel_label"]').contains('My Label');
      cy.get('[data-cy="reactiveFunctionLabel_textinput"]').should(
        'have.attr',
        'placeholder',
        'My Placeholder',
      );
      cy.get('[data-cy="reactiveFunctionLabel_textinput"]').clear();
      cy.get('[data-cy="reactiveFunctionLabel_textinput"]').type('New Label');
      cy.get('[data-cy="reactiveFunctionLabel_label"]').contains('New Label');
      cy.get('[data-cy="reactiveFunctionLabel_textinput"]').should(
        'have.attr',
        'placeholder',
        'New Label Placeholder',
      );
    });
  });
};
