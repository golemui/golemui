import { defineForm } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runRequiredComponentTests = (mountFn: MountComponentFn) => {
  describe('Field required', () => {
    context('control fields', () => {
      context('textinput', () => {
        const widget = 'textinput';
        const uid = `${widget}-uid`;
        const selector = `[data-cy="${uid}_${widget}"]`;

        it('should not be required by default', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test' }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'required');
          cy.get(selector).should('not.have.attr', 'aria-required');
        });

        it('should not be required when the validator sets required to false', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  validator: { type: 'string', required: false },
                },
              ],
            }),
          });
          cy.get(selector).should('not.have.attr', 'required');
          cy.get(selector).should('not.have.attr', 'aria-required');
        });

        it('should be required when the validator sets required to true', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  validator: { type: 'string', required: true },
                },
              ],
            }),
          });
          cy.get(selector).should('have.attr', 'required');
          cy.get(selector).should('have.attr', 'aria-required', 'true');
        });

        it('should not be required when disabled without a validator', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', disabled: true }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'required');
          cy.get(selector).should('not.have.attr', 'aria-required');
        });
      });

      context('number', () => {
        const widget = 'number';
        const uid = `${widget}-uid`;
        const selector = `[data-cy="${uid}_${widget}"]`;

        it('should not be required by default', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test' }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'required');
          cy.get(selector).should('not.have.attr', 'aria-required');
        });

        it('should be required when the validator sets required to true', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  validator: { type: 'number', required: true },
                },
              ],
            }),
          });
          cy.get(selector).should('have.attr', 'required');
          cy.get(selector).should('have.attr', 'aria-required', 'true');
        });
      });

      context('radiogroup', () => {
        const widget = 'radiogroup';
        const uid = `${widget}-uid`;
        // The group semantics live on the role="radiogroup" container, not
        // only on the individual radio inputs
        const groupSelector = `[role="radiogroup"][id="${uid}"]`;
        const options = ['One', 'Two'];

        it('should not mark the group required by default', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test', props: { options } }],
            }),
          });
          cy.get(groupSelector).should('not.have.attr', 'aria-required');
        });

        it('should mark the group required when the validator sets required to true', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  props: { options },
                  validator: { type: 'string', required: true },
                },
              ],
            }),
          });
          cy.get(groupSelector).should('have.attr', 'aria-required', 'true');
        });
      });

      context('select', () => {
        const widget = 'select';
        const uid = `${widget}-uid`;
        const selector = `[data-cy="${uid}_${widget}"]`;

        it('should not be required by default', () => {
          mountFn({
            formDef: defineForm({
              form: [{ uid, kind: 'input', type: widget, path: 'test' }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'required');
          cy.get(selector).should('not.have.attr', 'aria-required');
        });

        it('should be required when the validator sets required to true', () => {
          mountFn({
            formDef: defineForm({
              form: [
                {
                  uid,
                  kind: 'input',
                  type: widget,
                  path: 'test',
                  validator: { type: 'string', required: true },
                },
              ],
            }),
          });
          cy.get(selector).should('have.attr', 'required');
          cy.get(selector).should('have.attr', 'aria-required', 'true');
        });
      });
    });
  });
};
