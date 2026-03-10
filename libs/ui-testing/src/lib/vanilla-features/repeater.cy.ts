import * as Core from '@golemui/core';
import { MountComponentFn } from '../utils';

export const runRepeaterComponentTests = (mountFn: MountComponentFn) => {
  describe('Repeater Component', () => {
    const TEAMS_REPEATER_PATH = 'repeaters.teams';
    const DEVELOPERS_REPEATER_PATH = 'repeaters.teams.items.developers';
    const SKILLS_REPEATER_PATH = 'repeaters.teams.items.developers.items.skills';
    const SUBMIT_BUTTON_UID = 'submitBtn';

    const getFormDefinition = () =>
      Core.defineForm({
        states: {
          limitReached: `$form.repeaters?.teams?.[0]?.developers?.length === 5`,
        },
        form: [
          {
            uid: '',
            kind: 'layout',
            type: 'flex',
            children: [
              {
                uid: 'teamRepeater',
                kind: 'input',
                type: 'repeater',
                path: TEAMS_REPEATER_PATH,
                props: {
                  addLabel: 'Add new team',
                  'addLabel.limitReached': `Limit Reached, you can't add more`,
                  removeLabel: 'Remove team',
                  template: {
                    kind: 'layout',
                    type: 'flex',
                    children: [
                      {
                        uid: 'teamName',
                        kind: 'input',
                        type: 'textinput',
                        path: `${TEAMS_REPEATER_PATH}.items.teamName`,
                        label: 'Team Name',
                        validator: { type: 'string', required: true },
                      },
                      {
                        uid: 'devRepeater',
                        kind: 'input',
                        type: 'repeater',
                        path: DEVELOPERS_REPEATER_PATH,
                        props: {
                          addLabel: 'Add new developer',
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
                                label: 'First Name',
                                path: `${DEVELOPERS_REPEATER_PATH}.items.firstName`,
                                validator: { type: 'string', required: true },
                              },
                              {
                                uid: 'lastName',
                                kind: 'input',
                                type: 'textinput',
                                label: 'Last Name',
                                path: `${DEVELOPERS_REPEATER_PATH}.items.lastName`,
                              },
                              {
                                uid: 'skillRepeater',
                                kind: 'input',
                                type: 'repeater',
                                path: SKILLS_REPEATER_PATH,
                                props: {
                                  addLabel: 'Add new skill',
                                  removeLabel: 'Remove skill',
                                  template: {
                                    kind: 'layout',
                                    type: 'flex',
                                    children: [
                                      {
                                        uid: 'developerSkill',
                                        kind: 'input',
                                        type: 'textinput',
                                        path: `${SKILLS_REPEATER_PATH}.items.skill`,
                                        label: 'Skill',
                                        validator: { type: 'string', required: true },
                                      },
                                    ],
                                  },
                                },
                              },
                            ],
                          },
                        },
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
          teams: [
            {
              teamName: 'Team A',
              developers: [
                {
                  firstName: 'Alice',
                  lastName: 'Smith',
                  skills: [{ skill: 'JavaScript' }, { skill: 'React' }],
                },
              ],
            },
          ],
        },
      };

      mountFn({
        data: initialData,
        formDef: getFormDefinition(),
      });

      cy.get('[data-cy="teamName[0]_textinput"]').should('have.value', 'Team A');
      cy.get('[data-cy="firstName[0][0]_textinput"]').should('have.value', 'Alice');
      cy.get('[data-cy="lastName[0][0]_textinput"]').should('have.value', 'Smith');
      cy.get('[data-cy="developerSkill[0][0][0]_textinput"]').should('have.value', 'JavaScript');
      cy.get('[data-cy="developerSkill[0][0][1]_textinput"]').should('have.value', 'React');
    });

    it('should show "Limit Reached" label when collection hits the limit', () => {
      // Fill the collection to 5 items to trigger the 'limitReached' state
      const limitData = {
        repeaters: {
          teams: [
            {
              teamName: 'Team A',
              developers: new Array(5).fill({ firstName: 'User', lastName: 'Test', skills: [] }),
            },
          ],
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
          teams: [
            {
              teamName: '',
              developers: [
                {
                  firstName: '',
                  lastName: 'Smith',
                  skills: [{ skill: 'JavaScript' }, { skill: '' }],
                },
              ],
            },
          ],
        },
      };

      mountFn({
        data: initialData,
        formDef: getFormDefinition(),
      });

      cy.get(`[data-cy="${SUBMIT_BUTTON_UID}_button"]`).click();

      // firstName[0][0] is required, so validation should trigger on that specific index
      cy.get('[data-cy="teamName[0]_validator-error"]').should('be.visible');
      cy.get('[data-cy="firstName[0][0]_validator-error"]').should('be.visible');
      cy.get('[data-cy="developerSkill[0][0][1]_validator-error"]').should('be.visible');
    });

    it('should remove items and maintain correct indexing in the DOM', () => {
      const initialData = {
        repeaters: {
          teams: [
            {
              teamName: 'Team A',
              developers: [
                {
                  firstName: 'Alice',
                  lastName: 'Smith',
                  skills: [{ skill: 'JavaScript' }, { skill: 'React' }],
                },
                {
                  firstName: 'John',
                  lastName: 'Doe',
                  skills: [{ skill: 'TypeScript' }, { skill: 'Angular' }],
                },
              ],
            },
          ],
        },
      };

      mountFn({
        data: initialData,
        formDef: getFormDefinition(),
      });

      // Click remove on the first row
      cy.get('.gui-button').contains('Remove developer').first().click();

      // The old second developer (John) should now be at index [0][0]
      cy.get('[data-cy="firstName[0][0]_textinput"]').should('have.value', 'John');
      cy.get('[data-cy="firstName[0][1]_textinput"]').should('not.exist');
    });

    it('should add and then remove items', () => {
      const initialData = {
        repeaters: {
          teams: [{ teamName: 'Team A', developers: [] }],
        },
      };

      mountFn({
        data: initialData,
        formDef: getFormDefinition(),
      });

      // Add three developers inside the existing team
      cy.get('.gui-button').contains('Add new developer').click();
      cy.get('.gui-button').contains('Add new developer').click();
      cy.get('.gui-button').contains('Add new developer').click();

      // Fill the text inputs
      cy.get('[data-cy="firstName[0][0]_textinput"]').type('First');
      cy.get('[data-cy="firstName[0][1]_textinput"]').type('Second');
      cy.get('[data-cy="firstName[0][2]_textinput"]').type('Third');

      // Click remove on the first row
      cy.get('.gui-button').contains('Remove developer').first().click();

      // The index [0][0] now should have "Second"
      cy.get('[data-cy="firstName[0][0]_textinput"]').should('have.value', 'Second');
      cy.get('[data-cy="firstName[0][1]_textinput"]').should('have.value', 'Third');
      cy.get('[data-cy="firstName[0][2]_textinput"]').should('not.exist');
    });
  });
};
