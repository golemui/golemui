import * as Core from '@golemui/core';
import { MountComponentFn } from '../utils';

export const runRepeaterComponentTests = (mountFn: MountComponentFn) => {
  describe('Repeater Component', () => {
    const REPEATER_PATH = 'repeaters.users';
    const SUBMIT_BUTTON_UID = 'submitBtn';

    const getFormDefinition = () =>
      Core.defineForm({
        states: {
          limitReached: `$form.${REPEATER_PATH}?.length === 5`,
        },
        form: [
          {
            uid: '',
            kind: 'layout',
            type: 'flex',
            children: [
              {
                uid: 'devRepeater',
                kind: 'input',
                type: 'repeater',
                path: REPEATER_PATH,
                props: {
                  addLabel: 'Add new developer',
                  'addLabel.limitReached': "Limit Reached, you can't add more",
                  removeLabel: 'Remove developer',
                  limit: 5,
                  template: {
                    kind: 'layout',
                    type: 'flex',
                    children: [
                      {
                        uid: 'firstName',
                        kind: 'input',
                        type: 'textinput',
                        path: `${REPEATER_PATH}.items.firstName`,
                        validator: { type: 'string', required: true },
                      },
                      {
                        uid: 'lastName',
                        kind: 'input',
                        type: 'textinput',
                        path: `${REPEATER_PATH}.items.lastName`,
                      },
                    ],
                  },
                },
              },
            ],
          },
          {
            uid: SUBMIT_BUTTON_UID,
            kind: 'action',
            type: 'button',
            label: 'Login',
            on: {
              click: 'submit',
            },
          },
        ],
      });

    it('should render initial data correctly with complex paths', () => {
      const initialData = {
        repeaters: {
          users: [
            { firstName: '0. Alice', lastName: '0. Johnson' },
            { firstName: '', lastName: '1. Smith' },
            { firstName: '2. Charlie' },
          ],
        },
      };

      mountFn({
        data: initialData,
        formDef: getFormDefinition(),
      });

      cy.get('[data-cy="firstName[0]_textinput"]').should('have.value', '0. Alice');
      cy.get('[data-cy="lastName[1]_textinput"]').should('have.value', '1. Smith');
      cy.get('[data-cy="firstName[2]_textinput"]').should('have.value', '2. Charlie');
    });

    it('should show "Limit Reached" label when collection hits the limit', () => {
      // Fill the collection to 5 items to trigger the 'limitReached' state
      const limitData = {
        repeaters: {
          users: new Array(5).fill({ firstName: 'User', lastName: 'Test' }),
        },
      };

      mountFn({
        data: limitData,
        formDef: getFormDefinition(),
      });

      cy.get('.gui-button').contains("Limit Reached, you can't add more").should('be.visible');
    });

    it('should trigger validation error on required field within the repeater', () => {
      const initialData = {
        repeaters: {
          users: [{ firstName: '', lastName: 'Incomplete' }],
        },
      };

      mountFn({
        data: initialData,
        formDef: getFormDefinition(),
      });

      cy.get(`[data-cy="${SUBMIT_BUTTON_UID}_button"]`).click();

      // firstName[0] is required, so validation should trigger on that specific index
      cy.get('[data-cy="firstName[0]_validator-error"]').should('be.visible');
    });

    it('should remove items and maintain correct indexing in the DOM', () => {
      const initialData = {
        repeaters: {
          users: [
            { firstName: 'First', lastName: 'User' },
            { firstName: 'Second', lastName: 'User' },
          ],
        },
      };

      mountFn({
        data: initialData,
        formDef: getFormDefinition(),
      });

      // Click remove on the first row
      cy.get('.gui-button').contains('Remove developer').first().click();

      // The old "Second" user should now be at index [0]
      cy.get('[data-cy="firstName[0]_textinput"]').should('have.value', 'Second');
      cy.get('[data-cy="firstName[1]_textinput"]').should('not.exist');
    });
  });
};
