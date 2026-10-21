import { defineForm } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runRadiogroupComponentTests = (mountFn: MountComponentFn) => {
  describe('Radiogroup Component', () => {
    const form = (props: Record<string, unknown> = {}) =>
      defineForm({
        form: [
          {
            uid: 'range',
            kind: 'input',
            type: 'radiogroup',
            path: 'range',
            label: 'Range',
            props: {
              options: [
                { label: 'Day', value: 'day' },
                { label: 'Week', value: 'week' },
                { label: 'Month', value: 'month' },
              ],
              ...props,
            },
          },
          {
            uid: 'save',
            kind: 'action',
            type: 'button',
            label: 'Save',
            actionType: 'submit',
          },
        ],
      });

    it('shows radio buttons by default', () => {
      mountFn({ formDef: form() });

      cy.get('gui-radiogroup [role="radiogroup"]').should(
        'not.have.class',
        'gui-widget--segmented',
      );
    });

    it('shows a segmented control with appearance segmented, and picks with a click', () => {
      const formSubmit = cy.stub().as('formSubmit');
      mountFn({ formDef: form({ appearance: 'segmented' }), data: { range: 'day' }, formSubmit });

      cy.get('gui-radiogroup [role="radiogroup"]').should('have.class', 'gui-widget--segmented');
      cy.contains('gui-radiogroup label', 'Week').click();
      cy.get('[data-cy="range_radiogroup_1"]').should('be.checked');

      cy.get('[data-cy="save_button"]').click();
      cy.get('@formSubmit').its('lastCall.args.0.data.range').should('equal', 'week');
    });
  });
};
