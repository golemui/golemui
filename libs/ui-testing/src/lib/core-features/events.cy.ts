import { type FormEvent, type FormHealth, defineForm } from '@golemui/core';
import { eventsNamed, type MountComponentFn } from '../utils';

export const runEventsComponentTests = (mountFn: MountComponentFn) => {
  describe('Events', () => {
    it('Should execute form errors', () => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: '',
              kind: 'input',
              type: 'asdf',
              path: 'asdf',
              props: {},
            },
          ],
        }),
      });

      cy.get('@formHealth').should('have.been.calledWith', {
        status: 'errored',
        message: '[30] Widget "asdf" could not be loaded',
        code: 30,
      } satisfies FormHealth);
    });

    it('Should execute form events on load', () => {
      const mockSubregions = ['Europe', 'Asia', 'Americas'];

      const formEventHandler = cy.stub().as('formEventHandler');
      formEventHandler.callsFake(async (event: FormEvent) => {
        if (event.name === 'getSubregionsForSelect') {
          await new Promise((r) => setTimeout(r, 50));

          if (event.callback) {
            event.callback({
              type: 'OVERRIDE_WIDGET_PROP',
              payload: {
                path: 'subregion',
                prop: 'options',
                value: mockSubregions,
              },
            });
          }
        }
      });

      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'eventSelect',
              kind: 'input',
              type: 'select',
              path: 'subregion',
              label: 'Country subregion',
              on: {
                load: 'getSubregionsForSelect',
              },
            },
          ],
        }),
        formEvent: formEventHandler,
      });

      cy.get('@formEventHandler').should('have.been.called');
      cy.get('[data-cy="eventSelect_select"] option').should('have.length', 4);
    });

    it('Should emit load once per row widget across row changes', () => {
      const formEventHandler = cy.stub().as('formEventHandler');

      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'users',
              kind: 'input',
              type: 'repeater',
              path: 'users',
              props: {
                addLabel: 'Add user',
                removeLabel: 'Remove user',
                template: {
                  kind: 'layout',
                  type: 'grid',
                  children: [
                    {
                      uid: 'name',
                      kind: 'input',
                      type: 'textinput',
                      label: 'Name',
                      path: 'users.items.name',
                      on: { load: 'rowInputLoaded' },
                    },
                  ],
                },
              },
            },
          ],
        }),
        data: { users: [{ name: 'Ada' }, { name: 'Linus' }] },
        formEvent: formEventHandler,
      });

      const loadCallCount = () =>
        formEventHandler.getCalls().filter((call) => call.args[0].name === 'rowInputLoaded').length;

      // One load per row input on mount.
      cy.get('[data-cy="name[1]_textinput"]').should('exist');
      cy.get('@formEventHandler').should(() => expect(loadCallCount()).to.equal(2));

      // A new row loads once, the surviving rows do not load again.
      cy.get('.gui-button').contains('Add user').click();
      cy.get('[data-cy="name[2]_textinput"]').should('exist');
      cy.get('@formEventHandler').should(() => expect(loadCallCount()).to.equal(3));

      // Removing a row reuses the remaining row components, so nothing loads again.
      cy.get('.gui-button').contains('Remove user').first().click();
      cy.get('[data-cy="name[2]_textinput"]').should('not.exist');
      cy.get('[data-cy="name[0]_textinput"]').should('have.value', 'Linus');
      cy.get('@formEventHandler').should(() => expect(loadCallCount()).to.equal(3));
    });

    it('Should send the repeater row with an event from a row widget', () => {
      const formEventHandler = cy.stub().as('formEventHandler');

      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'users',
              kind: 'input',
              type: 'repeater',
              path: 'users',
              props: {
                removeLabel: 'Remove user',
                template: {
                  kind: 'layout',
                  type: 'grid',
                  children: [
                    {
                      uid: 'name',
                      kind: 'input',
                      type: 'textinput',
                      label: 'Name',
                      path: 'users.items.name',
                    },
                    {
                      uid: 'pickUser',
                      kind: 'action',
                      type: 'button',
                      label: 'Pick',
                      on: { click: 'userPicked' },
                    },
                  ],
                },
              },
            },
          ],
        }),
        data: { users: [{ name: 'Ada' }, { name: 'Linus' }, { name: 'Grace' }] },
        formEvent: formEventHandler,
      });

      const pickEvents = (): FormEvent[] =>
        formEventHandler
          .getCalls()
          .map((call) => call.args[0] as FormEvent)
          .filter((event) => event.name === 'userPicked');

      cy.get('[data-cy="pickUser[2]_button"]').click();
      cy.get('@formEventHandler').should(() => {
        expect(pickEvents()).to.have.length(1);
        expect(pickEvents()[0].row).to.deep.equal({ index: 2, indexes: [2], path: 'users.2' });
        expect(pickEvents()[0].data['users'][2].name).to.equal('Grace');
      });

      // The row components are reused after a removal, so Grace's button must send its new row.
      cy.get('.gui-button').contains('Remove user').first().click();
      cy.get('[data-cy="name[2]_textinput"]').should('not.exist');
      cy.get('[data-cy="pickUser[1]_button"]').click();
      cy.get('@formEventHandler').should(() => {
        expect(pickEvents()).to.have.length(2);
        expect(pickEvents()[1].row).to.deep.equal({ index: 1, indexes: [1], path: 'users.1' });
        expect(pickEvents()[1].data['users'][1].name).to.equal('Grace');
      });
    });

    describe('rows of nested repeaters', () => {
      const teamsForm = () =>
        defineForm({
          form: [
            {
              uid: 'teams',
              kind: 'input',
              type: 'repeater',
              path: 'teams',
              props: {
                removeLabel: 'Remove team',
                template: {
                  kind: 'layout',
                  type: 'grid',
                  children: [
                    {
                      uid: 'developers',
                      kind: 'input',
                      type: 'repeater',
                      path: 'teams.items.developers',
                      props: {
                        removeLabel: 'Remove developer',
                        template: {
                          kind: 'layout',
                          type: 'grid',
                          children: [
                            {
                              uid: 'devName',
                              kind: 'input',
                              type: 'textinput',
                              path: 'teams.items.developers.items.name',
                              on: { change: 'devNameChanged' },
                            },
                            {
                              uid: 'pickDev',
                              kind: 'action',
                              type: 'button',
                              label: 'Pick',
                              on: { click: 'devPicked' },
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
            {
              uid: 'outsideButton',
              kind: 'action',
              type: 'button',
              label: 'Outside',
              on: { click: 'outsideClicked' },
            },
          ],
        });

      const teamsData = {
        teams: [
          { developers: [{ name: 'Ada' }] },
          { developers: [{ name: 'Linus' }, { name: 'Grace' }] },
        ],
      };

      it('Should send every row index of a button in a nested row, and the new row after an outer removal', () => {
        const formEventHandler = cy.stub().as('formEventHandler');
        mountFn({ formDef: teamsForm(), data: teamsData, formEvent: formEventHandler });

        cy.get('[data-cy="pickDev[1][1]_button"]').click();
        cy.get('@formEventHandler').should(() => {
          const events = eventsNamed(formEventHandler, 'devPicked');
          expect(events).to.have.length(1);
          expect(events[0].row).to.deep.equal({
            index: 1,
            indexes: [1, 1],
            path: 'teams.1.developers.1',
          });
        });

        // Team 1 moves to position 0, so Grace's button now sends row [0][1]
        cy.get('.gui-repeater__remove-btn').filter(':contains("Remove team")').eq(0).click();
        cy.get('[data-cy="devName[1][0]_textinput"]').should('not.exist');
        cy.get('[data-cy="devName[0][1]_textinput"]').should('have.value', 'Grace');
        cy.get('[data-cy="pickDev[0][1]_button"]').click();
        cy.get('@formEventHandler').should(() => {
          const events = eventsNamed(formEventHandler, 'devPicked');
          expect(events).to.have.length(2);
          expect(events[1].row).to.deep.equal({
            index: 1,
            indexes: [0, 1],
            path: 'teams.0.developers.1',
          });
          expect(events[1].data['teams'][0].developers[1].name).to.equal('Grace');
        });
      });

      it('Should send the row with a change event from an input in a nested row', () => {
        const formEventHandler = cy.stub().as('formEventHandler');
        mountFn({ formDef: teamsForm(), data: teamsData, formEvent: formEventHandler });

        cy.get('[data-cy="devName[1][0]_textinput"]').type('!');
        cy.get('@formEventHandler').should(() => {
          const events = eventsNamed(formEventHandler, 'devNameChanged');
          expect(events).to.have.length(1);
          expect(events[0].row).to.deep.equal({
            index: 0,
            indexes: [1, 0],
            path: 'teams.1.developers.0',
          });
          expect(events[0].data['teams'][1].developers[0].name).to.equal('Linus!');
        });
      });

      it('Should send no row key with an event from a widget outside any repeater', () => {
        const formEventHandler = cy.stub().as('formEventHandler');
        mountFn({ formDef: teamsForm(), data: teamsData, formEvent: formEventHandler });

        cy.get('[data-cy="pickDev[0][0]_button"]').click();
        cy.get('[data-cy="outsideButton_button"]').click();
        cy.get('@formEventHandler').should(() => {
          const insideEvents = eventsNamed(formEventHandler, 'devPicked');
          expect(insideEvents).to.have.length(1);
          expect(insideEvents[0]).to.have.property('row');
          const outsideEvents = eventsNamed(formEventHandler, 'outsideClicked');
          expect(outsideEvents).to.have.length(1);
          expect(outsideEvents[0]).to.not.have.property('row');
        });
      });
    });

    it('Should execute form events on change', () => {
      const mockCountries: any = {
        europe: ['Spain', 'France', 'Italy'],
        asia: ['China', 'India', 'Japan'],
        americas: ['USA', 'Canada', 'Mexico'],
      };

      const formEventHandler = cy.stub().as('formEventHandler');
      formEventHandler.callsFake(async (event: FormEvent) => {
        if (event.name === 'getCountriesForSelect') {
          await new Promise((r) => setTimeout(r, 50));

          if (event.callback) {
            event.callback({
              type: 'OVERRIDE_WIDGET_PROP',
              payload: {
                path: 'country',
                prop: 'options',
                value: mockCountries[event.data['region']],
              },
            });
          }
        }
      });

      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'regionSelect',
              kind: 'input',
              type: 'select',
              path: 'region',
              props: {
                options: [
                  { label: 'Europe', value: 'europe' },
                  { label: 'Asia', value: 'asia' },
                  { label: 'Americas', value: 'americas' },
                ],
              },
              on: {
                change: 'getCountriesForSelect',
              },
            },
            {
              uid: 'countrySelect',
              kind: 'input',
              type: 'select',
              path: 'country',
              label: 'Country',
            },
          ],
        }),
        formEvent: formEventHandler,
      });

      cy.get('[data-cy="regionSelect_select"]').select('europe');
      cy.get('@formEventHandler').should('have.been.called');
      cy.get('[data-cy="countrySelect_select"] option').eq(1).contains('Spain');

      cy.get('[data-cy="regionSelect_select"]').select('asia');
      cy.get('@formEventHandler').should('have.been.called');
      cy.get('[data-cy="countrySelect_select"] option').eq(1).contains('China');
    });

    it('Should execute form events on change with detail', () => {
      const formEventHandler = cy.stub().as('formEventHandler');

      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'tabsComponent',
              kind: 'layout',
              type: 'tabs',
              props: {
                defaultOpen: 'tab1',
                tabs: [
                  { label: 'Alert Component', uid: 'tab1' },
                  { label: 'Flex Layout', uid: 'tab2' },
                ],
              },
              on: { change: 'onTabEvent' },
              children: [
                {
                  uid: 'tab1',
                  kind: 'display',
                  type: 'alert',
                  props: {
                    text: 'Some fields need your attention 1',
                    level: 'warning',
                  },
                },
                {
                  uid: 'tab2',
                  kind: 'display',
                  type: 'alert',
                  props: {
                    text: 'Some fields need your attention 2',
                    level: 'warning',
                  },
                },
              ],
            },
          ],
        }),
        formEvent: formEventHandler,
      });

      cy.get('[data-cy="tab_tabsComponent_tab2"]').click();
      cy.get('@formEventHandler').should('have.been.calledWithMatch', {
        name: 'onTabEvent',
        detail: 'tab2',
      });
      cy.get('[data-cy="tabpanel_tabsComponent_tab2"]').should('have.attr', 'tabindex', '0');

      cy.get('[data-cy="tab_tabsComponent_tab1"]').click();
      cy.get('@formEventHandler').should('have.been.calledWithMatch', {
        name: 'onTabEvent',
        detail: 'tab1',
      });
      cy.get('[data-cy="tabpanel_tabsComponent_tab1"]').should('have.attr', 'tabindex', '0');
    });

    it('Should execute form events on click', () => {
      const mockRegions: any = ['Spain', 'France', 'Italy'];

      const formEventHandler = cy.stub().as('formEventHandler');
      formEventHandler.callsFake(async (event: FormEvent) => {
        if (event.name === 'getRegionsForSelect') {
          await new Promise((r) => setTimeout(r, 50));

          if (event.callback) {
            event.callback({
              type: 'OVERRIDE_WIDGET_PROP',
              payload: {
                path: 'region',
                prop: 'options',
                value: mockRegions,
              },
            });
          }
        }
      });

      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'regionSelect',
              kind: 'input',
              type: 'select',
              path: 'region',
            },
            {
              uid: 'loadCountriesButton',
              kind: 'action',
              type: 'button',
              label: 'Load Countries',
              on: {
                click: 'getRegionsForSelect',
              },
            },
          ],
        }),
        formEvent: formEventHandler,
      });

      cy.get('[data-cy="loadCountriesButton_button"]').click();
      cy.get('@formEventHandler').should('have.been.called');
      cy.get('[data-cy="regionSelect_select"] option').should('have.length', 4);
    });

    it('Should override widget props by uid on button click', () => {
      const formEventHandler = cy.stub().as('formEventHandler');
      formEventHandler.callsFake((event: FormEvent) => {
        if (event.name === 'updateAlerts') {
          if (event.callback) {
            event.callback({
              type: 'OVERRIDE_WIDGET_PROP',
              payload: { uid: 'alertFirst', prop: 'text', value: 'First alert updated' },
            });
            event.callback({
              type: 'OVERRIDE_WIDGET_PROP',
              payload: { uid: 'alertSecond', prop: 'text', value: 'Second alert updated' },
            });
          }
        }
      });

      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'alertFirst',
              kind: 'display',
              type: 'alert',
              props: {
                text: 'First alert default text',
                level: 'info',
              },
            },
            {
              uid: 'alertSecond',
              kind: 'display',
              type: 'alert',
              props: {
                text: 'Second alert default text',
                level: 'info',
              },
            },
            {
              uid: 'updateAlertsButton',
              kind: 'action',
              type: 'button',
              label: 'Update Alerts',
              on: {
                click: 'updateAlerts',
              },
            },
          ],
        }),
        formEvent: formEventHandler,
      });

      cy.get('[id="alertFirst"][role="alert"]').should('contain.text', 'First alert default text');
      cy.get('[id="alertSecond"][role="alert"]').should(
        'contain.text',
        'Second alert default text',
      );

      cy.get('[data-cy="updateAlertsButton_button"]').click();

      cy.get('@formEventHandler').should('have.been.called');
      cy.get('[id="alertFirst"][role="alert"]').should('contain.text', 'First alert updated');
      cy.get('[id="alertSecond"][role="alert"]').should('contain.text', 'Second alert updated');
    });
  });
};
