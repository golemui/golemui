import { MountComponentFn } from '../utils';
import * as Core from '@golemui/core';

export const runFieldLoadersComponentTests = (mountFn: MountComponentFn) => {
  describe('Field Loaders', () => {
    it('Should load a custom component', () => {
      mountFn(
        Core.defineForm({
          form: [
            {
              uid: '',
              kind: 'display',
              widget: 'heading',
              props: {
                text: 'KITCHEN SINK',
                level: 3,
              },
            },
          ],
        }),
      );

      cy.get('[data-cy="heading"]').should('exist');
    });
  });
};
