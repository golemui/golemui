import * as Core from '@golemui/core';
import { MountComponentFn } from '../utils';

export const runReadonlyComponentTests = (mountFn: MountComponentFn) => {
  describe('Field readonly', () => {
    context('control fields', () => {
      context('textinput', () => {
        const widget = 'textinput';
        const uid = `${widget}-uid`;
        const selector = `[data-cy="${uid}_${widget}"]`;

        it('should not be readonly by default', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'control', widget, path: 'test' }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'readonly');
        });

        it('should not be readonly when set to false', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'control', widget, path: 'test', readonly: false }],
            }),
          });
          cy.get(selector).should('not.have.attr', 'readonly');
        });

        it('should be readonly when set to true', () => {
          mountFn({
            formDef: Core.defineForm({
              form: [{ uid, kind: 'control', widget, path: 'test', readonly: true }],
            }),
          });
          cy.get(selector).should('have.attr', 'readonly');
        });

        it('should be readonly via a state', () => {
          mountFn({
            formDef: Core.defineForm({
              states: { register: 'true' },
              form: [
                {
                  uid,
                  kind: 'control',
                  widget,
                  path: 'test',
                  disabled: false,
                  'readonly.register': true,
                },
              ],
            }),
          });
          cy.get(selector).should('have.attr', 'readonly');
        });
      });
    });
  });
};
