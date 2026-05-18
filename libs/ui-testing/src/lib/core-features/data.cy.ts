import { defineForm } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runDataComponentTests = (mountFn: MountComponentFn) => {
  describe('Data', () => {
    it('should set default data', () => {
      mountFn({
        data: {
          stringData: 'string data',
          numberData: 123,
          booleanData: true,
          selectData: 'option2',
          radioData: 'radio2',
        },
        formDef: defineForm({
          form: [
            {
              uid: 'stringData',
              kind: 'input',
              type: 'textinput',
              path: 'stringData',
            },
            {
              uid: 'numberData',
              kind: 'input',
              type: 'number',
              path: 'numberData',
            },
            {
              uid: 'booleanData',
              kind: 'input',
              type: 'checkbox',
              path: 'booleanData',
            },
            {
              uid: 'selectData',
              kind: 'input',
              type: 'select',
              path: 'selectData',
              props: {
                options: ['option1', 'option2'],
              },
            },
            {
              uid: 'radioData',
              kind: 'input',
              type: 'radiogroup',
              path: 'radioData',
              props: {
                options: ['radio1', 'radio2'],
              },
            },
          ],
        }),
      });
      cy.get('[data-cy="stringData_textinput"]').should('have.value', 'string data');
      cy.get('[data-cy="numberData_number"]').should('have.value', 123);
      cy.get('[data-cy="booleanData_checkbox"]').should('be.checked');
      cy.get('[data-cy="selectData_select"]').should('have.value', 'option2');
      cy.get('[data-cy="radioData_radiogroup_1"]').should('be.checked');
    });
  });
};
