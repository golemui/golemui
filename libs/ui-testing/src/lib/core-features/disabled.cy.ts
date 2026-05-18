import { defineForm } from '@golemui/core'
import { type Option } from '@golemui/gui-shared';
import { type MountComponentFn } from '../utils';

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
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test' }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should not be disabled when set to false', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: false }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should be disabled when set to true', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: true }],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });

        it('should be disabled via a state', () => {
          mountFn({
            formDef: defineForm({
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

        it('should be disabled via a when expression', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'lock-uid',
                  kind: 'input',
                  type: 'checkbox',
                  path: 'isLocked',
                },
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  disabled: { when: '$form.isLocked !== true' },
                },
              ],
            }),
          });

          cy.get(selector).should('have.attr', 'disabled');

          // Toggle the lock checkbox to true, which enables the input
          cy.get('[data-cy="lock-uid_checkbox"]').click();
          cy.get(selector).should('not.have.attr', 'disabled');
        });
      });

      context('checkbox', () => {
        const widget = 'checkbox';
        const uid = `${widget}-uid`;
        const selector = `[data-cy="${uid}_${widget}"]`;

        it('should not be disabled by default', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test' }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should not be disabled when set to false', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: false }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should be disabled when set to true', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: true }],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });

        it('should be disabled via a state', () => {
          mountFn({
            formDef: defineForm({
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

        it('should be disabled via a when expression', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'lock-uid',
                  kind: 'input',
                  type: 'checkbox',
                  path: 'isLocked',
                },
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  disabled: { when: '$form.isLocked !== true' },
                },
              ],
            }),
          });

          cy.get(selector).should('have.attr', 'disabled');

          cy.get('[data-cy="lock-uid_checkbox"]').click();
          cy.get(selector).should('not.have.attr', 'disabled');
        });
      });

      context('number', () => {
        const widget = 'number';
        const uid = `${widget}-uid`;
        const selector = `[data-cy="${uid}_${widget}"]`;

        it('should not be disabled by default', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test' }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should not be disabled when set to false', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: false }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should be disabled when set to true', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: true }],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });

        it('should be disabled via a state', () => {
          mountFn({
            formDef: defineForm({
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

        it('should be disabled via a when expression', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'lock-uid',
                  kind: 'input',
                  type: 'checkbox',
                  path: 'isLocked',
                },
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  disabled: { when: '$form.isLocked !== true' },
                },
              ],
            }),
          });

          cy.get(selector).should('have.attr', 'disabled');

          cy.get('[data-cy="lock-uid_checkbox"]').click();
          cy.get(selector).should('not.have.attr', 'disabled');
        });
      });

      context('select', () => {
        const widget = 'select';
        const uid = `${widget}-uid`;
        const selector = `[data-cy="${uid}_${widget}"]`;

        it('should not be disabled by default', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test' }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should not be disabled when set to false', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: false }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should be disabled when set to true', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: true }],
            }),
          });
          cy.get(selector).should('have.attr', 'disabled');
        });

        it('should be disabled via a state', () => {
          mountFn({
            formDef: defineForm({
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

        it('should be disabled via a when expression', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'lock-uid',
                  kind: 'input',
                  type: 'checkbox',
                  path: 'isLocked',
                },
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  disabled: { when: '$form.isLocked !== true' },
                },
              ],
            }),
          });

          cy.get(selector).should('have.attr', 'disabled');

          cy.get('[data-cy="lock-uid_checkbox"]').click();
          cy.get(selector).should('not.have.attr', 'disabled');
        });
      });

      context('radiogroup', () => {
        const widget = 'radiogroup';
        const uid = `${widget}-uid`;
        const selector = `[data-cy="${uid}_${widget}_0"]`;

        it('should not be disabled by default', () => {
          mountFn({
            formDef: defineForm({
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
            formDef: defineForm({
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
            formDef: defineForm({
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
            formDef: defineForm({
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

        it('should be disabled via a when expression', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'lock-uid',
                  kind: 'input',
                  type: 'checkbox',
                  path: 'isLocked',
                },
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  disabled: { when: '$form.isLocked !== true' },
                  props: { options },
                },
              ],
            }),
          });

          cy.get(selector).should('have.attr', 'disabled');

          cy.get('[data-cy="lock-uid_checkbox"]').click();
          cy.get(selector).should('not.have.attr', 'disabled');
        });
      });
    });

    context('interactive fields', () => {
      context('button', () => {
        const uid = 'button-uid';
        const selector = `[data-cy="${uid}_button"]`;

        it('should not be disabled by default', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'action', type: 'button', label: 'Send' }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should not be disabled when set to false', () => {
          mountFn({
            formDef: defineForm({
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
            formDef: defineForm({
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
            formDef: defineForm({
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

        it('should be disabled via a when expression', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'lock-uid',
                  kind: 'input',
                  type: 'checkbox',
                  path: 'isLocked',
                },
                {
                  uid,
                  kind: 'action',
                  type: 'button',
                  label: 'Send',
                  disabled: { when: '$form.isLocked !== true' },
                },
              ],
            }),
          });

          cy.get(selector).should('have.attr', 'disabled');

          cy.get('[data-cy="lock-uid_checkbox"]').click();
          cy.get(selector).should('not.have.attr', 'disabled');
        });

        it('should be disabled via $formIsInvalid when form has validation errors', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid: 'userName',
                  kind: 'input',
                  type: 'textinput',
                  path: 'userName',
                  validator: { type: 'string', required: true },
                },
                {
                  uid,
                  kind: 'action',
                  type: 'button',
                  label: 'Submit',
                  disabled: { when: '$formIsInvalid' },
                  on: { click: 'submit' },
                },
              ],
            }),
          });

          // Initially $formIsInvalid is false -> button is enabled
          cy.get(selector).should('not.have.attr', 'disabled');

          // Submit with empty required field -> validation fires -> $formIsInvalid becomes true
          cy.get(selector).click();
          cy.get('[data-cy="userName_validator-errors"]').should('exist');
          cy.get(selector).should('have.attr', 'disabled');

          // Fill the required field -> errors clear -> $formIsInvalid becomes false
          cy.get('[data-cy="userName_textinput"]').type('Alice');
          cy.get('[data-cy="userName_validator-errors"]').should('not.exist');
          cy.get(selector).should('not.have.attr', 'disabled');
        });
      });
    });
  });
};
