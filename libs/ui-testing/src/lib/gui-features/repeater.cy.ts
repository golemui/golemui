import { defineForm, identityTranslator } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runRepeaterComponentTests = (mountFn: MountComponentFn) => {
  describe('Repeater Component', () => {
    const TEAMS_REPEATER_PATH = 'repeaters.teams';
    const DEVELOPERS_REPEATER_PATH = `${TEAMS_REPEATER_PATH}.items.developers`;
    const SKILLS_REPEATER_PATH = `${DEVELOPERS_REPEATER_PATH}.items.skills`;
    const SUBMIT_BUTTON_UID = 'submitBtn';

    const getFormDefinition = () =>
      defineForm({
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
            actionType: 'submit',
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

    it('removing the first row shifts the remaining values into the reused rows', () => {
      const ROWS_PATH = 'rows';
      const item = (field: string) => `${ROWS_PATH}.items.${field}`;
      mountFn({
        localization: identityTranslator('en-US'),
        data: {
          rows: [
            {
              name: 'Alice',
              age: 30,
              active: true,
              color: 'red',
              day: '2026-06-10',
              pick: '2026-06-11',
            },
            {
              name: 'Bob',
              age: 40,
              active: false,
              color: 'green',
              day: '2026-06-12',
              pick: '2026-06-13',
            },
            {
              name: 'Carol',
              age: 50,
              active: true,
              color: 'blue',
              day: '2026-06-14',
              pick: '2026-06-15',
            },
          ],
        },
        formDef: defineForm({
          form: [
            {
              uid: 'rowsRepeater',
              kind: 'input',
              type: 'repeater',
              path: ROWS_PATH,
              props: {
                addLabel: 'Add row',
                removeLabel: 'Remove row',
                template: {
                  kind: 'layout',
                  type: 'flex',
                  children: [
                    { uid: 'name', kind: 'input', type: 'textinput', path: item('name') },
                    { uid: 'age', kind: 'input', type: 'number', path: item('age') },
                    { uid: 'active', kind: 'input', type: 'checkbox', path: item('active') },
                    {
                      uid: 'color',
                      kind: 'input',
                      type: 'select',
                      path: item('color'),
                      props: { options: ['red', 'green', 'blue'] },
                    },
                    { uid: 'day', kind: 'input', type: 'dateInput', path: item('day') },
                    { uid: 'pick', kind: 'input', type: 'datePicker', path: item('pick') },
                  ],
                },
              },
            },
          ],
        }),
      });

      // The picker renders its own gui-date, so keep the two families apart
      const plainDateDay = 'gui-date:not(gui-date-picker gui-date) input[data-type="day"]';
      const pickerDateDay = 'gui-date-picker gui-date input[data-type="day"]';

      // Make every control in rows 1 and 2 dirty so a reused DOM node has to follow the store
      cy.get('[data-cy="name[1]_textinput"]').clear().type('Bob typed');
      cy.get('[data-cy="name[2]_textinput"]').clear().type('Carol typed');
      cy.get('[data-cy="age[1]_number"]').clear().type('41');
      cy.get('[data-cy="age[2]_number"]').clear().type('51').blur();
      cy.get('[data-cy="active[1]_checkbox"]').click();
      cy.get('[data-cy="active[2]_checkbox"]').click();
      cy.get('[data-cy="color[1]_select"]').select('blue');
      cy.get('[data-cy="color[2]_select"]').select('red');
      cy.get(plainDateDay).eq(1).clear().type('20');
      cy.get(plainDateDay).eq(2).clear().type('21');
      cy.get(pickerDateDay).eq(1).clear().type('22');
      cy.get(pickerDateDay).eq(2).clear().type('23').blur();

      cy.get('.gui-button').contains('Remove row').first().click();

      cy.get('[data-cy="name[0]_textinput"]').should('have.value', 'Bob typed');
      cy.get('[data-cy="name[1]_textinput"]').should('have.value', 'Carol typed');
      cy.get('[data-cy="name[2]_textinput"]').should('not.exist');
      cy.get('[data-cy="age[0]_number"]').should('have.value', '41');
      cy.get('[data-cy="age[1]_number"]').should('have.value', '51');
      cy.get('[data-cy="active[0]_checkbox"]').should('be.checked');
      cy.get('[data-cy="active[1]_checkbox"]').should('not.be.checked');
      cy.get('[data-cy="color[0]_select"]').should('have.value', 'blue');
      cy.get('[data-cy="color[1]_select"]').should('have.value', 'red');
      cy.get(plainDateDay).eq(0).should('have.value', '20');
      cy.get(plainDateDay).eq(1).should('have.value', '21');
      cy.get(pickerDateDay).eq(0).should('have.value', '22');
      cy.get(pickerDateDay).eq(1).should('have.value', '23');
    });

    it('should expose $formIsInvalid as true when a repeater item field has a validation error', () => {
      mountFn({
        data: {
          repeaters: {
            teams: [{ teamName: '' }],
          },
        },
        formDef: defineForm({
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
              actionType: 'submit',
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
        defineForm({
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

      it('should interpolate $item and $index independently per repeater item', () => {
        const LINE_ITEMS_PATH = 'lineItems';
        const getItemScopeFormDefinition = () =>
          defineForm({
            form: [
              {
                uid: 'lineItemsRepeater',
                kind: 'input',
                type: 'repeater',
                path: LINE_ITEMS_PATH,
                props: {
                  addLabel: 'Add line item',
                  removeLabel: 'Remove line item',
                  template: {
                    kind: 'layout',
                    type: 'flex',
                    children: [
                      {
                        uid: 'qty',
                        kind: 'input',
                        type: 'textinput',
                        path: `${LINE_ITEMS_PATH}.items.quantity`,
                        label: 'Quantity',
                      },
                      {
                        uid: 'rowTotal',
                        kind: 'display',
                        type: 'alert',
                        props: {
                          level: 'success',
                          text: 'Row {{$index + 1}} total: {{($item.quantity ?? 0) * 2}}',
                        },
                        include: { when: '$item.quantity !== undefined' },
                      },
                    ],
                  },
                },
              },
            ],
          });

        mountFn({
          data: { lineItems: [{ quantity: 2 }, { quantity: 5 }, {}] },
          formDef: getItemScopeFormDefinition(),
        });

        // Each row reads its own $item and $index
        cy.get('[id="rowTotal[0]"]').should('contain.text', 'Row 1 total: 4');
        cy.get('[id="rowTotal[1]"]').should('contain.text', 'Row 2 total: 10');
        // include.when with $item: quantity is undefined on the third item
        cy.get('[id="rowTotal[2]"]').should('not.exist');

        // Typing in row 1 must only affect row 1's total
        cy.get('[data-cy="qty[1]_textinput"]').clear();
        cy.get('[data-cy="qty[1]_textinput"]').type('7');
        cy.get('[id="rowTotal[1]"]').should('contain.text', 'Row 2 total: 14');
        cy.get('[id="rowTotal[0]"]').should('contain.text', 'Row 1 total: 4');

        // Removing row 0 rebinds $item/$index: the old row 1 becomes row 0
        cy.get('.gui-button').contains('Remove line item').first().click();
        cy.get('[id="rowTotal[0]"]').should('contain.text', 'Row 1 total: 14');
        cy.get('[id="rowTotal[1]"]').should('not.exist');
      });

      it('should render markdownText displays with $item interpolation inside repeater items', () => {
        const LINE_ITEMS_PATH = 'invoiceLines';
        const getMarkdownItemScopeFormDefinition = () =>
          defineForm({
            form: [
              {
                uid: 'invoiceLinesRepeater',
                kind: 'input',
                type: 'repeater',
                path: LINE_ITEMS_PATH,
                props: {
                  addLabel: 'Add invoice line',
                  removeLabel: 'Remove invoice line',
                  template: {
                    kind: 'layout',
                    type: 'flex',
                    children: [
                      {
                        uid: 'lineQty',
                        kind: 'input',
                        type: 'textinput',
                        path: `${LINE_ITEMS_PATH}.items.quantity`,
                        label: 'Quantity',
                      },
                      {
                        uid: 'lineTotalMd',
                        kind: 'display',
                        type: 'markdownText',
                        props: {
                          md: 'Row {{$index + 1}} total: {{($item.quantity ?? 0) * 2}}',
                        },
                        include: { when: '$item.quantity !== undefined' },
                      },
                    ],
                  },
                },
              },
            ],
          });

        mountFn({
          data: { invoiceLines: [{ quantity: 2 }, {}] },
          formDef: getMarkdownItemScopeFormDefinition(),
          // The markdown widget renders nothing without a parser; a passthrough
          // parser keeps the test dependency-free while still proving the
          // dependency reaches the component and the interpolated text renders.
          dependencies: { markdown: { parse: (markdown: string) => markdown } },
        });

        // Interpolated $item/$index content must actually render in the DOM
        cy.get('[id="lineTotalMd[0]"]').should('contain.text', 'Row 1 total: 4');
        // include.when with $item: quantity is undefined on the second item
        cy.get('[id="lineTotalMd[1]"]').should('not.exist');

        // Editing the row updates the rendered markdown
        cy.get('[data-cy="lineQty[0]_textinput"]').clear();
        cy.get('[data-cy="lineQty[0]_textinput"]').type('5');
        cy.get('[id="lineTotalMd[0]"]').should('contain.text', 'Row 1 total: 10');
      });

      it('should scope $item and $index to the innermost item in nested repeaters', () => {
        const ORDERS_PATH = 'orders';
        const LINES_PATH = `${ORDERS_PATH}.items.lines`;
        const getNestedItemScopeFormDefinition = () =>
          defineForm({
            form: [
              {
                uid: 'orderRepeater',
                kind: 'input',
                type: 'repeater',
                path: ORDERS_PATH,
                props: {
                  addLabel: 'Add order',
                  removeLabel: 'Remove order',
                  template: {
                    kind: 'layout',
                    type: 'flex',
                    children: [
                      {
                        uid: 'customer',
                        kind: 'input',
                        type: 'textinput',
                        path: `${ORDERS_PATH}.items.customer`,
                        label: 'Customer',
                      },
                      {
                        uid: 'lineRepeater',
                        kind: 'input',
                        type: 'repeater',
                        path: LINES_PATH,
                        props: {
                          addLabel: 'Add line',
                          removeLabel: 'Remove line',
                          template: {
                            kind: 'layout',
                            type: 'flex',
                            children: [
                              {
                                uid: 'qty',
                                kind: 'input',
                                type: 'textinput',
                                path: `${LINES_PATH}.items.quantity`,
                                label: 'Quantity',
                              },
                              {
                                uid: 'lineSubtotal',
                                kind: 'display',
                                type: 'alert',
                                props: {
                                  level: 'success',
                                  text: 'Line {{$index + 1}} subtotal: {{($item.quantity ?? 0) * ($item.price ?? 0)}}',
                                },
                                include: { when: '$item.quantity !== undefined' },
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

        mountFn({
          data: {
            orders: [
              {
                customer: 'Acme',
                lines: [{ quantity: 2, price: 10 }, { quantity: 1, price: 5 }, {}],
              },
              { customer: 'Globex', lines: [{ quantity: 3, price: 4 }] },
            ],
          },
          formDef: getNestedItemScopeFormDefinition(),
        });

        // $item and $index are the innermost line, so each line reads its own values.
        // $index restarts at 0 inside every order's line repeater.
        cy.get('[id="lineSubtotal[0][0]"]').should('contain.text', 'Line 1 subtotal: 20');
        cy.get('[id="lineSubtotal[0][1]"]').should('contain.text', 'Line 2 subtotal: 5');
        // The first line of the second order is index 0 again and reads its own $item (3 * 4).
        cy.get('[id="lineSubtotal[1][0]"]').should('contain.text', 'Line 1 subtotal: 12');
        // include.when with $item: the third line of the first order has no quantity
        cy.get('[id="lineSubtotal[0][2]"]').should('not.exist');

        // Typing in the second order's line only affects that line's subtotal
        cy.get('[data-cy="qty[1][0]_textinput"]').clear();
        cy.get('[data-cy="qty[1][0]_textinput"]').type('10');
        cy.get('[id="lineSubtotal[1][0]"]').should('contain.text', 'Line 1 subtotal: 40');
        cy.get('[id="lineSubtotal[0][0]"]').should('contain.text', 'Line 1 subtotal: 20');
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

    describe('layouts nested in a repeater row', () => {
      const NESTED_ROWS_PATH = 'nestedRows';
      const nestedRowsData = {
        nestedRows: [
          { first: 'Alice', second: 'Ann' },
          { first: 'Bob', second: 'Bea' },
        ],
      };

      it('renders the active panel of a tabs layout in every repeater row', () => {
        mountFn({
          localization: identityTranslator('en-US'),
          data: nestedRowsData,
          formDef: defineForm({
            form: [
              {
                uid: 'nestedRowsRepeater',
                kind: 'input',
                type: 'repeater',
                path: NESTED_ROWS_PATH,
                props: {
                  addLabel: 'Add row',
                  removeLabel: 'Remove row',
                  template: {
                    uid: 'rowTabs',
                    kind: 'layout',
                    type: 'tabs',
                    props: {
                      renderMode: 'activeOnly',
                      tabs: [
                        { uid: 'firstPanel', label: 'First' },
                        { uid: 'secondPanel', label: 'Second' },
                      ],
                    },
                    children: [
                      {
                        uid: 'firstPanel',
                        kind: 'input',
                        type: 'textinput',
                        path: `${NESTED_ROWS_PATH}.items.first`,
                        label: 'First',
                      },
                      {
                        uid: 'secondPanel',
                        kind: 'input',
                        type: 'textinput',
                        path: `${NESTED_ROWS_PATH}.items.second`,
                        label: 'Second',
                      },
                    ],
                  },
                },
              },
            ],
          }),
        });

        // Every row shows its own value in the tab that is open by default
        cy.get('[data-cy="firstPanel[0]_textinput"]').should('have.value', 'Alice');
        cy.get('[data-cy="firstPanel[1]_textinput"]').should('have.value', 'Bob');
        cy.get('[data-cy="secondPanel[0]_textinput"]').should('not.exist');

        // Switching a tab in the second row opens that row's panel only
        cy.get('[data-cy="tab_rowTabs[1]_1"]').click();
        cy.get('[data-cy="secondPanel[1]_textinput"]').should('have.value', 'Bea');
        cy.get('[data-cy="secondPanel[0]_textinput"]').should('not.exist');
      });

      it('renders the open section of an accordion in every repeater row', () => {
        mountFn({
          localization: identityTranslator('en-US'),
          data: nestedRowsData,
          formDef: defineForm({
            form: [
              {
                uid: 'nestedRowsRepeater',
                kind: 'input',
                type: 'repeater',
                path: NESTED_ROWS_PATH,
                props: {
                  addLabel: 'Add row',
                  removeLabel: 'Remove row',
                  template: {
                    uid: 'rowAccordion',
                    kind: 'layout',
                    type: 'accordion',
                    props: {
                      renderMode: 'activeOnly',
                      defaultOpen: { firstSection: true },
                      sections: [
                        { uid: 'firstSection', label: 'First' },
                        { uid: 'secondSection', label: 'Second' },
                      ],
                    },
                    children: [
                      {
                        uid: 'firstSection',
                        kind: 'input',
                        type: 'textinput',
                        path: `${NESTED_ROWS_PATH}.items.first`,
                        label: 'First',
                      },
                      {
                        uid: 'secondSection',
                        kind: 'input',
                        type: 'textinput',
                        path: `${NESTED_ROWS_PATH}.items.second`,
                        label: 'Second',
                      },
                    ],
                  },
                },
              },
            ],
          }),
        });

        // Every row shows its own value in the section that is open by default
        cy.get('[data-cy="firstSection[0]_textinput"]').should('have.value', 'Alice');
        cy.get('[data-cy="firstSection[1]_textinput"]').should('have.value', 'Bob');
        cy.get('[data-cy="secondSection[1]_textinput"]').should('not.exist');

        // The section buttons carry the template uid, so pick the one of the second row
        cy.get('[id="accordion_button_secondSection"]').eq(1).click();
        cy.get('[data-cy="secondSection[1]_textinput"]').should('have.value', 'Bea');
        cy.get('[data-cy="secondSection[0]_textinput"]').should('not.exist');
      });
    });
  });
};
