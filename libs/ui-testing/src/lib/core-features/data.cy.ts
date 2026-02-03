import * as Core from '@golemui/core';
import { MountComponentFn } from '../utils';

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
        formDef: Core.defineForm({
          form: [
            {
              uid: 'stringData',
              kind: 'input',
              widget: 'textinput',
              path: 'stringData',
            },
            {
              uid: 'numberData',
              kind: 'input',
              widget: 'number',
              path: 'numberData',
            },
            {
              uid: 'booleanData',
              kind: 'input',
              widget: 'checkbox',
              path: 'booleanData',
            },
            {
              uid: 'selectData',
              kind: 'input',
              widget: 'select',
              path: 'selectData',
              props: {
                options: ['option1', 'option2'],
              },
            },
            {
              uid: 'radioData',
              kind: 'input',
              widget: 'radiogroup',
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
