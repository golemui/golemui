import * as Core from '@golemui/core';
import { controlWidgets, Option } from '@golemui/shared-vanilla';
import { MountComponentFn } from '../utils';

const controls = controlWidgets.filter((w) => w !== 'repeater');
const options: Option[] = [
  { label: 'Opt 1', value: 'o1' },
  { label: 'Opt 2', value: 'o2' },
];

export const runDisabledComponentTests = (mountFn: MountComponentFn) => {
  describe('Field disabled', () => {
    context('control fields', () => {
      controls.forEach((widget) => {
        const uid = `${widget}-uid`;
        const selector =
          widget === 'radiogroup'
            ? `[data-cy="${uid}_${widget}_0"]`
            : `[data-cy="${uid}_${widget}"]`;
        it(`${widget} should not be disabled by default`, () => {
          mountFn(
            Core.defineForm({
              form: [
                {
                  uid,
                  kind: 'control',
                  widget,
                  path: 'test',
                  props: widget === 'radiogroup' ? { options } : undefined,
                },
              ],
            }),
          );
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it(`${widget} should not be disabled when set to false`, () => {
          const uid = `${widget}-uid`;
          mountFn(
            Core.defineForm({
              form: [
                {
                  uid,
                  kind: 'control',
                  widget,
                  disabled: false,
                  path: 'test',
                  props: widget === 'radiogroup' ? { options } : undefined,
                },
              ],
            }),
          );
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it(`${widget} should be disabled when set to true`, () => {
          const uid = `${widget}-uid`;
          mountFn(
            Core.defineForm({
              form: [
                {
                  uid,
                  kind: 'control',
                  widget,
                  disabled: true,
                  path: 'test',
                  props: widget === 'radiogroup' ? { options } : undefined,
                },
              ],
            }),
          );
          cy.get(selector).should('have.attr', 'disabled');
        });

        it(`${widget} should be disabled via a state`, () => {
          const uid = `${widget}-uid`;
          mountFn(
            Core.defineForm({
              states: {
                register: 'true',
              },
              form: [
                {
                  uid,
                  kind: 'control',
                  widget,
                  disabled: false,
                  'disabled.register': true,
                  path: 'test',
                  props: widget === 'radiogroup' ? { options } : undefined,
                },
              ],
            }),
          );
          cy.get(selector).should('have.attr', 'disabled');
        });
      });
    });

    context('interactive fields', () => {
      it(`button should not be disabled by default`, () => {
        const uid = `button-uid`;
        mountFn(
          Core.defineForm({
            form: [
              {
                uid,
                kind: 'interactive',
                widget: 'button',
                label: 'Send',
              },
            ],
          }),
        );
        cy.get(`[data-cy="${uid}_button"]`).should('not.have.attr', 'disabled');
      });

      it(`button should not be disabled when set to false`, () => {
        const uid = `button-uid`;
        mountFn(
          Core.defineForm({
            form: [
              {
                uid,
                kind: 'interactive',
                widget: 'button',
                label: 'Send',
                disabled: false,
              },
            ],
          }),
        );
        cy.get(`[data-cy="${uid}_button"]`).should('not.have.attr', 'disabled');
      });

      it(`button should be disabled when set to true`, () => {
        const uid = `button-uid`;
        mountFn(
          Core.defineForm({
            form: [
              {
                uid,
                kind: 'interactive',
                widget: 'button',
                label: 'Send',
                disabled: true,
              },
            ],
          }),
        );
        cy.get(`[data-cy="${uid}_button"]`).should('have.attr', 'disabled');
      });

      it(`button should be disabled via a state`, () => {
        const uid = `button-uid`;
        mountFn(
          Core.defineForm({
            states: {
              register: 'true',
            },
            form: [
              {
                uid,
                kind: 'interactive',
                widget: 'button',
                label: 'Send',
                disabled: false,
                'disabled.register': true,
              },
            ],
          }),
        );
        cy.get(`[data-cy="${uid}_button"]`).should('have.attr', 'disabled');
      });
    });
  });
};
