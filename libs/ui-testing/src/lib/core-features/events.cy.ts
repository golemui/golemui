import * as Core from '@golemui/core';
import { MountComponentFn } from '../utils';

export const runEventsComponentTests = (mountFn: MountComponentFn) => {
  describe('Events', () => {
    it('Should execute form errors', () => {
      mountFn({
        formDef: Core.defineForm({
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
        message: 'Widget "asdf" could not be loaded',
      } satisfies Core.FormHealth);
    });

    it('Should execute form events on load', () => {
      const mockSubregions = ['Europe', 'Asia', 'Americas'];

      const formEventHandler = cy.stub().as('formEventHandler');
      formEventHandler.callsFake(async (event: Core.FormEvent) => {
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
        formDef: Core.defineForm({
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

    it('Should execute form events on change', () => {
      const mockCountries: any = {
        europe: ['Spain', 'France', 'Italy'],
        asia: ['China', 'India', 'Japan'],
        americas: ['USA', 'Canada', 'Mexico'],
      };

      const formEventHandler = cy.stub().as('formEventHandler');
      formEventHandler.callsFake(async (event: Core.FormEvent) => {
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
        formDef: Core.defineForm({
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
        formDef: Core.defineForm({
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

      cy.get('[data-cy="tab_tabsComponent_1"]').click();
      cy.get('@formEventHandler').should('have.been.calledWithMatch', {
        name: 'onTabEvent',
        detail: 'tab2',
      });
      cy.get('[data-cy="tabpanel_tabsComponent_1"]').should('exist');

      cy.get('[data-cy="tab_tabsComponent_0"]').click();
      cy.get('@formEventHandler').should('have.been.calledWithMatch', {
        name: 'onTabEvent',
        detail: 'tab1',
      });
      cy.get('[data-cy="tabpanel_tabsComponent_0"]').should('exist');
    });

    it('Should execute form events on click', () => {
      const mockRegions: any = ['Spain', 'France', 'Italy'];

      const formEventHandler = cy.stub().as('formEventHandler');
      formEventHandler.callsFake(async (event: Core.FormEvent) => {
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
        formDef: Core.defineForm({
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
  });
};
