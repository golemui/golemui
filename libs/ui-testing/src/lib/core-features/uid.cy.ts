import { type FormHealth, defineForm } from '@golemui/core'
import { type MountComponentFn } from '../utils';

export const runUidTests = (mountFn: MountComponentFn) => {
  describe('Field Uid', () => {
    it('should send an error when the same uid is used more than once', () => {
      mountFn({
        formDef: defineForm({
          form: [
            {
              uid: 'uid1',
              kind: 'input',
              type: 'textinput',
              label: 'Something 1',
              path: 'something1',
            },
            {
              uid: 'uid1',
              kind: 'display',
              type: 'alert',
              props: { text: 'You have been alerted' },
              include: { in: ['showAlert'] },
            },
          ],
        }),
      });

      cy.get('@formHealth').should('have.been.calledWithMatch', {
        status: 'errored',
        message:
          '[21] Duplicate UID "uid1": Assigned to widget "textinput" at "something1" and "alert".',
        code: 21,
      } satisfies FormHealth);
    });
  });
};
