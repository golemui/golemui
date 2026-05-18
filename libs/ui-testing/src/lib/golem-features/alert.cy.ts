import { defineForm } from '@golemui/core';
import { type MountComponentFn } from '../utils';

export const runAlertComponentTests = (mountFn: MountComponentFn) => {
  describe('Alert Component', () => {
    beforeEach(() => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: '',
              kind: 'display',
              type: 'alert',
              props: {
                text: 'Some fields need your attention',
                level: 'warning',
              },
            },
          ],
        }),
      });
    });

    it('should display a warning alert', () => {
      cy.get('.gui-alert-notification--warning')
        .should('exist')
        .and('contain.text', 'Some fields need your attention');
    });
  });
};
