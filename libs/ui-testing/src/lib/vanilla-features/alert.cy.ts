import * as Core from '@golemui/core';
import { MountComponentFn } from '../utils';

export const runAlertComponentTests = (mountFn: MountComponentFn) => {
  describe('Alert Component', () => {
    beforeEach(() => {
      mountFn(
        Core.defineForm({
          form: [
            {
              uid: '',
              kind: 'display',
              widget: 'alert',
              props: {
                text: 'Some fields need your attention',
                level: 'warning',
              },
            },
          ],
        }),
      );
    });

    it('should display a warning alert', () => {
      cy.get('.gui-alert-notification--warning')
        .should('exist')
        .and('contain.text', 'Some fields need your attention');
    });
  });
};
