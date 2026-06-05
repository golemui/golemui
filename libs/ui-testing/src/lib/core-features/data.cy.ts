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

    it('should not include hidden field data in submitted form data', () => {
      const formSubmitHandler = cy.stub().as('formSubmitHandler');

      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'showExtra',
              kind: 'input',
              type: 'checkbox',
              path: 'showExtra',
              label: 'Show extra field',
            },
            {
              uid: 'extraField',
              kind: 'input',
              type: 'textinput',
              path: 'extra',
              label: 'Extra field',
              include: { when: '$form.showExtra === true' },
            },
            {
              uid: 'submitBtn',
              kind: 'action',
              type: 'button',
              label: 'Submit',
              actionType: 'submit',
            },
          ],
        }),
        formSubmit: formSubmitHandler,
      });

      // Make the field visible and enter a value
      cy.get('[data-cy="showExtra_checkbox"]').click();
      cy.get('[data-cy="extraField_textinput"]').should('exist').type('hidden value');

      // Hide the field by unchecking the checkbox
      cy.get('[data-cy="showExtra_checkbox"]').click();
      cy.get('[data-cy="extraField_textinput"]').should('not.exist');

      // Submit the form
      cy.get('[data-cy="submitBtn_button"]').click();

      // The submitted data must not carry the value of the hidden field
      cy.get('@formSubmitHandler').should('have.been.calledOnce');
      cy.get('@formSubmitHandler').then((stub: any) => {
        const submittedData = stub.getCall(0).args[0].data;
        expect(submittedData).to.deep.equal({ showExtra: false });
      });
    });
  });
};
