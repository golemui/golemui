import { type MountComponentFn } from '../utils';
import { type Action, type Middleware, type State, defineForm } from '@golemui/core';

export const runMiddlewaresComponentTests = (mountFn: MountComponentFn) => {
  describe('Middlewares', () => {
    it('Should execute middlewares on initialize', () => {
      const middleware1: Middleware<State, Action> = () => (next) => (action) => next(action);
      const middleware2: Middleware<State, Action> = () => (next) => (action) => next(action);
      const spyMiddleware1 = cy.spy(middleware1).as('middleware1');
      const spyMiddleware2 = cy.spy(middleware2).as('middleware2');
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'check1',
              kind: 'input',
              type: 'checkbox',
              label: 'Check 1',
              path: 'check1',
              props: {},
            },
          ],
        }),
        middlewares: [spyMiddleware1, spyMiddleware2],
      });

      cy.get('@middleware1').should('be.called');
      cy.get('@middleware2').should('be.called');
      cy.get('[data-cy="check1_checkbox"]').click();
      cy.get('@middleware1').should('be.called');
      cy.get('@middleware2').should('be.called');
    });

    it('Should execute middlewares on update a value', () => {
      const middleware1: Middleware<State, Action> = () => (next) => (action) => next(action);
      const middleware2: Middleware<State, Action> = () => (next) => (action) => next(action);
      const spyMiddleware1 = cy.spy(middleware1).as('middleware1');
      const spyMiddleware2 = cy.spy(middleware2).as('middleware2');
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'check1',
              kind: 'input',
              type: 'checkbox',
              label: 'Check 1',
              path: 'check1',
              props: {},
            },
          ],
        }),
        middlewares: [spyMiddleware1, spyMiddleware2],
      });

      cy.get('[data-cy="check1_checkbox"]').click();
      cy.get('@middleware1').should('be.called');
      cy.get('@middleware2').should('be.called');
    });

    it('Should send the same action types in every framework for a mount, an edit and a submit', () => {
      const actionTypes: string[] = [];
      const recorder: Middleware<State, Action> = () => (next) => (action) => {
        actionTypes.push(action.type);
        return next(action);
      };
      mountFn({
        formDef: defineForm({
          form: [
            { uid: 'name', kind: 'input', type: 'textinput', path: 'name' },
            {
              uid: 'submit',
              kind: 'action',
              type: 'button',
              label: 'Submit',
              actionType: 'submit',
            },
          ],
        }),
        middlewares: [recorder],
      });

      // The checks retry until the actions arrive. The list is cleared after each check.
      const expectActions = (step: string, expected: string[]) => {
        cy.wrap(null).should(() => {
          expect([...actionTypes], step).to.deep.equal(expected);
        });
        cy.then(() => {
          actionTypes.length = 0;
        });
      };

      cy.get('[data-cy="name_textinput"]').should('exist');
      expectActions('mount', ['INITIALIZE', 'SET_DATA', 'SET_META']);

      cy.get('[data-cy="name_textinput"]').type('a');
      expectActions('edit', ['SET_WIDGET_DATA', 'ATTEMPT_VALIDATION']);

      cy.get('[data-cy="submit_button"]').click();
      cy.wrap(null).should(() => {
        expect(actionTypes, 'submit').to.include('VALIDATE_ALL');
        expect(actionTypes, 'submit').to.not.include('SET_WIDGET_DATA');
      });
    });
  });
};
