import { type MountComponentFn } from '../utils';
import { defineForm } from '@golemui/core';

export const runWidgetLoadersComponentTests = (mountFn: MountComponentFn) => {
  describe('Widget Loaders', () => {
    it('Should load a custom component', () => {
      mountFn({
        withCustomComponent: true,
        formDef: defineForm({
          form: [
            {
              uid: '',
              kind: 'display',
              type: 'heading',
              props: {
                text: 'KITCHEN SINK',
                level: 3,
              },
            },
          ],
        }),
      });

      cy.get('[data-cy="heading"]').should('exist');
    });
  });
};
