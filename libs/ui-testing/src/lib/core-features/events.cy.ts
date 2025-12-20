import { MountComponentFn } from '../utils';
import * as Core from '@golemui/core';

export const runEventsComponentTests = (mountFn: MountComponentFn) => {
  describe('Events', () => {
    it('Should execute form errors', () => {
      mountFn({
        formDef: Core.defineForm({
          form: [
            {
              uid: '',
              kind: 'control',
              widget: 'asdf',
              path: 'asdf',
              props: {},
            },
          ],
        }),
      });

      cy.get('@formError').should('have.been.calledWith', {
        kind: 'fatal',
        error: 'Field "asdf" could not be loaded',
      });
    });

    it('Should execute form events on load', () => {
      const mockSubregions = ['Europe', 'Asia', 'Americas'];

      const formEventHandler = cy.stub().as('formEventHandler');
      formEventHandler.callsFake(async (event: Core.FormEvent) => {
        if (event.name === 'getSubregionsForSelect') {
          await new Promise((r) => setTimeout(r, 50));

          if (event.callback) {
            event.callback({
              type: 'OVERRIDE_FIELD_PROP',
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
              kind: 'control',
              widget: 'select',
              path: 'subregion',
              label: 'Country subregion',
              on: {
                load: 'getSubregionsForSelect',
                change: 'getCountriesForSelect',
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
              type: 'OVERRIDE_FIELD_PROP',
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
              kind: 'control',
              widget: 'select',
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
              kind: 'control',
              widget: 'select',
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
  });
};
