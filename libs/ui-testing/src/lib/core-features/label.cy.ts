import * as Core from '@golemui/core';
import { controlWidgets } from '@golemui/shared-vanilla';
import { MountComponentFn } from '../utils';

const controls = controlWidgets.filter((w) => w !== 'repeater');

export const runLabelComponentTests = (mountFn: MountComponentFn) => {
  describe('Field label', () => {
    context('control fields', () => {
      controls.forEach((widget) => {
        it(`${widget} should have a label`, () => {
          const uid = `${widget}-uid`;
          const label = `${widget} label`;
          mountFn(
            Core.defineForm({
              form: [
                {
                  uid,
                  kind: 'control',
                  widget,
                  label,
                  path: 'test',
                },
              ],
            }),
          );
          cy.get(`label[for="${uid}"]`).should('exist');
          cy.get(`label[for="${uid}"]`).contains(label);
        });

        it.skip(`${widget} should have a 'label.register'`, () => {
          const uid = `${widget}-uid`;
          const label = `${widget} label`;
          mountFn(
            Core.defineForm({
              states: {
                register: '$form.a === undefined',
              },
              form: [
                {
                  uid,
                  kind: 'control',
                  widget,
                  label: 'wrong',
                  'label.register': label,
                  path: 'test',
                },
              ],
            }),
          );
          cy.get(`label[for="${uid}"]`).should('exist');
          cy.get(`label[for="${uid}"]`).contains(label);
        });
      });
    });

    context('interactive fields', () => {
      it(`button should have a label`, () => {
        const uid = '123';
        const label = `button label`;
        mountFn(
          Core.defineForm({
            form: [
              {
                uid,
                kind: 'interactive',
                widget: 'button',
                label,
              },
            ],
          }),
        );
        cy.get(`[data-cy="${uid}_button"]`).should('exist');
        cy.get(`[data-cy="${uid}_button"]`).contains(label);
      });

      it.skip(`button should have a 'label.register'`, () => {
        const uid = '123';
        const label = `button label`;
        mountFn(
          Core.defineForm({
            states: {
              register: '$form.a === undefined',
            },
            form: [
              {
                uid,
                kind: 'interactive',
                widget: 'button',
                label: 'wrong',
                'label.register': label,
              },
            ],
          }),
        );
        cy.get(`[data-cy="${uid}_button"]`).should('exist');
        cy.get(`[data-cy="${uid}_button"]`).contains(label);
      });
    });
  });
};
