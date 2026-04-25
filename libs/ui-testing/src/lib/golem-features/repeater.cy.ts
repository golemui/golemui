import * as Core from '@golemui/core';
import { MountComponentFn } from '../utils';

export const runRepeaterComponentTests = (mountFn: MountComponentFn) => {
  describe('Repeater Component', () => {
    const TEAMS_REPEATER_PATH = 'repeaters.teams';
    const DEVELOPERS_REPEATER_PATH = `${TEAMS_REPEATER_PATH}.items.developers`;
    const SKILLS_REPEATER_PATH = `${DEVELOPERS_REPEATER_PATH}.items.skills`;
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

    it('should expose $formIsInvalid as true when a repeater item field has a validation error', () => {
      mountFn({
        data: {
          repeaters: {
            teams: [{ teamName: '' }],
          },
        },
        formDef: Core.defineForm({
          form: [
            {
              uid: 'teamRepeater',
              kind: 'input',
              type: 'repeater',
              path: TEAMS_REPEATER_PATH,
              props: {
                addLabel: 'Add new team',
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
                  ],
                },
              },
            },
            {
              uid: SUBMIT_BUTTON_UID,
              kind: 'action',
              type: 'button',
              label: 'Submit',
              disabled: { when: '$formIsInvalid' },
              on: { click: 'submit' },
            },
          ],
        }),
      });

      // Initially $formIsInvalid is false -> submit button is enabled
      cy.get(`[data-cy="${SUBMIT_BUTTON_UID}_button"]`).should('not.have.attr', 'disabled');

      // Click submit with empty required teamName -> validation fires -> $formIsInvalid becomes true
      cy.get(`[data-cy="${SUBMIT_BUTTON_UID}_button"]`).click();
      cy.get('[data-cy="teamName[0]_validator-error"]').should('be.visible');
      cy.get(`[data-cy="${SUBMIT_BUTTON_UID}_button"]`).should('have.attr', 'disabled');

      // Fill the teamName field -> errors clear -> $formIsInvalid becomes false -> button re-enabled
      cy.get('[data-cy="teamName[0]_textinput"]').type('Alpha');
      cy.get('[data-cy="teamName[0]_validator-error"]').should('not.exist');
      cy.get(`[data-cy="${SUBMIT_BUTTON_UID}_button"]`).should('not.have.attr', 'disabled');
    });

    describe('states inside repeater items', () => {
      const getStatesFormDefinition = () =>
        Core.defineForm({
          states: {
            isApple: `$form.company === 'appl'`,
            isMsoft: `$form.company === 'msf'`,
            companyHasBeenPicked: `$form.company !== undefined`,
          },
          form: [
            {
              uid: 'companySelect',
              kind: 'input',
              type: 'select',
              path: 'company',
              label: 'Company',
              props: { options: ['msf', 'appl'] },
            },
            {
              uid: 'teamRepeater',
              kind: 'input',
              type: 'repeater',
              path: TEAMS_REPEATER_PATH,
              props: {
                addLabel: 'Add new team',
                removeLabel: 'Remove team',
                template: {
                  kind: 'layout',
                  type: 'flex',
                  children: [
                    {
                      uid: 'pickCompanyAlert',
                      kind: 'display',
                      type: 'alert',
                      props: { level: 'warning', text: 'Pick a company' },
                      exclude: { from: ['companyHasBeenPicked'] },
                    },
                    {
                      uid: 'companyStatusAlert',
                      kind: 'display',
                      type: 'alert',
                      props: {
                        level: 'error',
                        'level.companyHasBeenPicked': 'success',
                        text: 'Company has been picked but is unknown',
                        'text.isApple': 'Company is Apple',
                        'text.isMsoft': 'Company is Msoft',
                      },
                      include: { in: ['companyHasBeenPicked'] },
                    },
                    {
                      uid: 'teamName',
                      kind: 'input',
                      type: 'textinput',
                      path: `${TEAMS_REPEATER_PATH}.items.teamName`,
                      label: 'Team Name',
                    },
                    {
                      uid: 'teamNameTypedAlert',
                      kind: 'display',
                      type: 'alert',
                      props: { level: 'success', text: 'Team name has been typed' },
                      include: { when: `$form.${TEAMS_REPEATER_PATH}.items?.teamName?.length > 0` },
                    },
                    {
                      uid: 'devRepeater',
                      kind: 'input',
                      type: 'repeater',
                      path: DEVELOPERS_REPEATER_PATH,
                      props: {
                        addLabel: 'Add new developer',
                        removeLabel: 'Remove developer',
                        template: {
                          kind: 'layout',
                          type: 'flex',
                          children: [
                            {
                              uid: 'firstNameAlert',
                              kind: 'display',
                              type: 'alert',
                              props: { level: 'success', text: 'First name has been provided' },
                              include: {
                                when: `$form.${DEVELOPERS_REPEATER_PATH}.items?.firstName?.length > 0`,
                              },
                            },
                            {
                              uid: 'firstName',
                              kind: 'input',
                              type: 'textinput',
                              label: 'First Name',
                              path: `${DEVELOPERS_REPEATER_PATH}.items.firstName`,
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
        });

      it('should show/hide elements inside repeater items based on global states via include.in and exclude.from', () => {
        mountFn({
          data: { repeaters: { teams: [{}] } },
          formDef: getStatesFormDefinition(),
        });

        // pickCompanyAlert excludes from companyHasBeenPicked -> visible while no company is selected
        cy.get('[id="pickCompanyAlert[0]"]').should('be.visible');
        // companyStatusAlert includes in companyHasBeenPicked -> absent while no company is selected
        cy.get('[id="companyStatusAlert[0]"]').should('not.exist');

        cy.get('[data-cy="companySelect_select"]').select('appl');

        // After picking a company the visibility flips for both alerts
        cy.get('[id="pickCompanyAlert[0]"]').should('not.exist');
        cy.get('[id="companyStatusAlert[0]"]').should('be.visible');
      });

      it('should apply state-suffixed props to elements inside repeater items', () => {
        mountFn({
          data: { company: 'appl', repeaters: { teams: [{}] } },
          formDef: getStatesFormDefinition(),
        });

        // isApple is active -> 'text.isApple' prop overrides the default text
        cy.get('[id="companyStatusAlert[0]"]').should('contain.text', 'Company is Apple');

        cy.get('[data-cy="companySelect_select"]').select('msf');

        // isMsoft is now active -> 'text.isMsoft' prop overrides the default text
        cy.get('[id="companyStatusAlert[0]"]').should('contain.text', 'Company is Msoft');
      });

      it('should evaluate index-aware include.when expressions independently per repeater item', () => {
        mountFn({
          data: {
            repeaters: {
              teams: [
                { teamName: 'Alpha', developers: [{ firstName: 'Alice' }, { firstName: '' }] },
                { teamName: '', developers: [] },
              ],
            },
          },
          formDef: getStatesFormDefinition(),
        });

        // Team at index 0 has a teamName -> alert is present
        cy.get('[id="teamNameTypedAlert[0]"]').should('be.visible');
        // Team at index 1 has no teamName -> alert is absent
        cy.get('[id="teamNameTypedAlert[1]"]').should('not.exist');

        // Developer [0][0] has a firstName -> alert is present for that specific item
        cy.get('[id="firstNameAlert[0][0]"]').should('be.visible');
        // Developer [0][1] has no firstName -> alert is absent for that specific item
        cy.get('[id="firstNameAlert[0][1]"]').should('not.exist');
      });
    });
  });
};
