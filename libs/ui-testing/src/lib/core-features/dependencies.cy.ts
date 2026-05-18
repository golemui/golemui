import { defineForm } from '@golemui/core'
import { type MountComponentFn } from '../utils';

export const runComponentDependenciesTests = (mountFn: MountComponentFn) => {
  describe('3rd party dependencies', () => {
    it('Should provide dependencies', () => {
      mountFn({
        dependencies: {
          markdown: { parse: (md: string) => `PARSED: ${md}` },
        },
        data: { sample: 'Some markdown' },
        formDef: defineForm({
          form: [
            {
              uid: 'md1',
              kind: 'input',
              type: 'markdown',
              path: 'sample',
              props: {
                defaultOpenPreview: true,
              },
            },
          ],
        }),
      });

      cy.get('[data-cy="md1_markdown"]').should('contain', 'PARSED: Some markdown');
    });
  });
};
