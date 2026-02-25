import * as Core from '@golemui/core';
import { Option } from '@golemui/gui-components';
import { MountComponentFn } from '../utils';

const options: Option[] = [
  { label: 'Opt 1', value: 'o1' },
  { label: 'Opt 2', value: 'o2' },
];

export const runDisabledComponentTests = (mountFn: MountComponentFn) => {
  describe('Field disabled', () => {
    context('control fields', () => {
      context('textinput', () => {
        const widget = 'textinput';
        const uid = `${widget}-uid`;
        const selector = `[data-cy="${uid}_${widget}"]`;

        it('should not be disabled by default', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test' }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should not be disabled when set to false', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: false }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should be disabled when set to true', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: true }],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });

        it('should be disabled via a state', () => {
          mountFn({
            formDef: Core.defineForm({
              states: { register: 'true' },
              form: [
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  disabled: false,
                  'disabled.register': true,
                },
              ],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });
      });

      context('checkbox', () => {
        const widget = 'checkbox';
        const uid = `${widget}-uid`;
        const selector = `[data-cy="${uid}_${widget}"]`;

        it('should not be disabled by default', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test' }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should not be disabled when set to false', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: false }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should be disabled when set to true', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: true }],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });

        it('should be disabled via a state', () => {
          mountFn({
            formDef: Core.defineForm({
              states: { register: 'true' },
              form: [
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  disabled: false,
                  'disabled.register': true,
                },
              ],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });
      });

      context('number', () => {
        const widget = 'number';
        const uid = `${widget}-uid`;
        const selector = `[data-cy="${uid}_${widget}"]`;

        it('should not be disabled by default', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test' }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should not be disabled when set to false', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: false }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should be disabled when set to true', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: true }],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });

        it('should be disabled via a state', () => {
          mountFn({
            formDef: Core.defineForm({
              states: { register: 'true' },
              form: [
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  disabled: false,
                  'disabled.register': true,
                },
              ],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });
      });

      context('select', () => {
        const widget = 'select';
        const uid = `${widget}-uid`;
        const selector = `[data-cy="${uid}_${widget}"]`;

        it('should not be disabled by default', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test' }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should not be disabled when set to false', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: false }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should be disabled when set to true', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: true }],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });

        it('should be disabled via a state', () => {
          mountFn({
            formDef: Core.defineForm({
              states: { register: 'true' },
              form: [
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  disabled: false,
                  'disabled.register': true,
                },
              ],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });
      });

      context('radiogroup', () => {
        const widget = 'radiogroup';
        const uid = `${widget}-uid`;
        const selector = `[data-cy="${uid}_${widget}_0"]`;

        it('should not be disabled by default', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  props: { options },
                },
              ],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should not be disabled when set to false', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  disabled: false,
                  props: { options },
                },
              ],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should be disabled when set to true', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  disabled: true,
                  props: { options },
                },
              ],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });

        it('should be disabled via a state', () => {
          mountFn({
            formDef: Core.defineForm({
              states: { register: 'true' },
              form: [
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  disabled: false,
                  'disabled.register': true,
                  props: { options },
                },
              ],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });
      });
    });

    context('interactive fields', () => {
      context('button', () => {
        const uid = 'button-uid';
        const selector = `[data-cy="${uid}_button"]`;

        it('should not be disabled by default', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'action', type: 'button', label: 'Send' }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should not be disabled when set to false', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [
                {
                  uid,
                  kind: 'action',
                  type: 'button',
                  label: 'Send',
                  disabled: false,
                },
              ],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should be disabled when set to true', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [
                {
                  uid,
                  kind: 'action',
                  type: 'button',
                  label: 'Send',
                  disabled: true,
                },
              ],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });

        it('should be disabled via a state', () => {
          mountFn({
            formDef: Core.defineForm({
              states: { register: 'true' },
              form: [
                {
                  uid,
                  kind: 'action',
                  type: 'button',
                  label: 'Send',
                  disabled: false,
                  'disabled.register': true,
                },
              ],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });
      });
    });
  });
};
