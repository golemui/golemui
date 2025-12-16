import * as Core from '@golemui/core';
import { MountComponentFn } from '../utils';

export const runIncludeExcludeComponentTests = (mountFn: MountComponentFn) => {
  describe('Include/Exclude fields', () => {
    context('include fields', () => {
      it(`control fields should hide/show with include in`, () => {
        mountFn(
          Core.defineForm({
            states: {
              check1: '$form.check1 === true',
              'check1:check2': '$form.check2 === true',
            },
            form: [
              {
                uid: 'check1',
                kind: 'control',
                widget: 'checkbox',
                label: 'Check 1',
                path: 'check1',
                props: {},
              },
              {
                uid: 'check2',
                kind: 'control',
                widget: 'checkbox',
                label: 'Check 2',
                path: 'check2',
                props: {},
              },
              {
                uid: 'check1_check2',
                kind: 'control',
                widget: 'textinput',
                path: 'textinput',
                props: {},
                include: { in: ['check1:check2'] },
              },
            ],
          }),
        );

        cy.get('[data-cy="check1_check2_textinput"]').should('not.exist');
        cy.get('[data-cy="check1_checkbox"]').click();
        cy.get('[data-cy="check1_check2_textinput"]').should('not.exist');
        cy.get('[data-cy="check2_checkbox"]').click();
        cy.get('[data-cy="check1_check2_textinput"]').should('exist');
      });

      it(`control fields should hide/show with exclude from`, () => {
        mountFn(
          Core.defineForm({
            states: {
              check1: '$form.check1 === true',
              'check1:check2': '$form.check2 === true',
            },
            form: [
              {
                uid: 'check1',
                kind: 'control',
                widget: 'checkbox',
                label: 'Check 1',
                path: 'check1',
                props: {},
              },
              {
                uid: 'check2',
                kind: 'control',
                widget: 'checkbox',
                label: 'Check 2',
                path: 'check2',
                props: {},
              },
              {
                uid: 'check1_check2',
                kind: 'control',
                widget: 'textinput',
                path: 'textinput',
                props: {},
                exclude: { from: ['check1:check2'] },
              },
            ],
          }),
        );

        cy.get('[data-cy="check1_check2_textinput"]').should('exist');
        cy.get('[data-cy="check1_checkbox"]').click();
        cy.get('[data-cy="check1_check2_textinput"]').should('exist');
        cy.get('[data-cy="check2_checkbox"]').click();
        cy.get('[data-cy="check1_check2_textinput"]').should('not.exist');
      });
    });
  });
};
