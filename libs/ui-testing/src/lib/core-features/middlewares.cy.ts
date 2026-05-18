import { type MountComponentFn } from '../utils';
import { type Action, type Middleware, type State, defineForm } from '@golemui/core'

export const runMiddlewaresComponentTests = (mountFn: MountComponentFn) => {
  describe('Middlewares', () => {
    it('Should execute middlewares on initialize', () => {
      const middleware1: Middleware<State, Action> = () => (next) => (action) =>
        next(action);
      const middleware2: Middleware<State, Action> = () => (next) => (action) =>
        next(action);
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
      const middleware1: Middleware<State, Action> = () => (next) => (action) =>
        next(action);
      const middleware2: Middleware<State, Action> = () => (next) => (action) =>
        next(action);
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
  });
};
