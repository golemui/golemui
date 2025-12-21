import * as Core from '@golemui/core';
import { MountComponentFn } from '../utils';

export const runLabelComponentTests = (mountFn: MountComponentFn) => {
  describe('Field label', () => {
    context('control fields', () => {
      context('textinput', () => {
        it('should have a label', () => {
          const uid = 'textinput-uid';
          const label = 'textinput label';
          mountFn({
            formDef: Core.defineForm({
              form: [
                {
                  uid,
                  kind: 'control',
                  widget: 'textinput',
                  label,
                  path: 'test',
                },
              ],
            }),
          });
          cy.get(`label[for="${uid}"]`).should('exist').contains(label);
        });

        it('should have a label.register', () => {
          const uid = 'textinput-uid';
          const label = 'textinput label';
          mountFn({
            formDef: Core.defineForm({
              states: { register: 'true' },
              form: [
                {
                  uid,
                  kind: 'control',
                  widget: 'textinput',
                  label: 'wrong',
                  'label.register': label,
                  path: 'test',
                },
              ],
            }),
          });
          cy.get(`label[for="${uid}"]`).should('exist').contains(label);
        });
      });

      context('checkbox', () => {
        it('should have a label', () => {
          const uid = 'checkbox-uid';
          const label = 'checkbox label';
          mountFn({
            formDef: Core.defineForm({
              form: [
                {
                  uid,
                  kind: 'control',
                  widget: 'checkbox',
                  label,
                  path: 'test',
                },
              ],
            }),
          });
          cy.get(`label[for="${uid}"]`).should('exist').contains(label);
        });

        it('should have a label.register', () => {
          const uid = 'checkbox-uid';
          const label = 'checkbox label';
          mountFn({
            formDef: Core.defineForm({
              states: { register: 'true' },
              form: [
                {
                  uid,
                  kind: 'control',
                  widget: 'checkbox',
                  label: 'wrong',
                  'label.register': label,
                  path: 'test',
                },
              ],
            }),
          });
          cy.get(`label[for="${uid}"]`).should('exist').contains(label);
        });
      });

      context('number', () => {
        it('should have a label', () => {
          const uid = 'number-uid';
          const label = 'number label';
          mountFn({
            formDef: Core.defineForm({
              form: [
                {
                  uid,
                  kind: 'control',
                  widget: 'number',
                  label,
                  path: 'test',
                },
              ],
            }),
          });
          cy.get(`label[for="${uid}"]`).should('exist').contains(label);
        });

        it('should have a label.register', () => {
          const uid = 'number-uid';
          const label = 'number label';
          mountFn({
            formDef: Core.defineForm({
              states: { register: 'true' },
              form: [
                {
                  uid,
                  kind: 'control',
                  widget: 'number',
                  label: 'wrong',
                  'label.register': label,
                  path: 'test',
                },
              ],
            }),
          });
          cy.get(`label[for="${uid}"]`).should('exist').contains(label);
        });
      });

      context('select', () => {
        it('should have a label', () => {
          const uid = 'select-uid';
          const label = 'select label';
          mountFn({
            formDef: Core.defineForm({
              form: [
                {
                  uid,
                  kind: 'control',
                  widget: 'select',
                  label,
                  path: 'test',
                },
              ],
            }),
          });
          cy.get(`label[for="${uid}"]`).should('exist').contains(label);
        });

        it('should have a label.register', () => {
          const uid = 'select-uid';
          const label = 'select label';
          mountFn({
            formDef: Core.defineForm({
              states: { register: 'true' },
              form: [
                {
                  uid,
                  kind: 'control',
                  widget: 'select',
                  label: 'wrong',
                  'label.register': label,
                  path: 'test',
                },
              ],
            }),
          });
          cy.get(`label[for="${uid}"]`).should('exist').contains(label);
        });
      });

      context('radiogroup', () => {
        it('should have a label', () => {
          const uid = 'radiogroup-uid';
          const label = 'radiogroup label';
          mountFn({
            formDef: Core.defineForm({
              form: [
                {
                  uid,
                  kind: 'control',
                  widget: 'radiogroup',
                  label,
                  path: 'test',
                },
              ],
            }),
          });
          cy.get(`label[for="${uid}"]`).should('exist').contains(label);
        });

        it('should have a label.register', () => {
          const uid = 'radiogroup-uid';
          const label = 'radiogroup label';
          mountFn({
            formDef: Core.defineForm({
              states: { register: 'true' },
              form: [
                {
                  uid,
                  kind: 'control',
                  widget: 'radiogroup',
                  label: 'wrong',
                  'label.register': label,
                  path: 'test',
                },
              ],
            }),
          });
          cy.get(`label[for="${uid}"]`).should('exist').contains(label);
        });
      });
    });

    context('interactive fields', () => {
      context('button', () => {
        it('should have a label', () => {
          const uid = '123';
          const label = 'button label';
          mountFn({
            formDef: Core.defineForm({
              form: [
                {
                  uid,
                  kind: 'interactive',
                  widget: 'button',
                  label,
                },
              ],
            }),
          });
          cy.get(`[data-cy="${uid}_button"]`).should('exist').contains(label);
        });

        it('should have a label.register', () => {
          const uid = '123';
          const label = 'button label';
          mountFn({
            formDef: Core.defineForm({
              states: { register: 'true' },
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
          });
          cy.get(`[data-cy="${uid}_button"]`).should('exist').contains(label);
        });
      });
    });
  });
};
