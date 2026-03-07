import * as Core from '@golemui/core';
import { MountComponentFn } from '../utils';

export const runComponentDependenciesTests = (mountFn: MountComponentFn) => {
  describe('3rd party dependencies', () => {
    it('Should provide dependencies', () => {
      mountFn({
        dependencies: {
          markdown: { parse: (md: string) => `PARSED: ${md}` },
        },
        data: { sample: 'Some markdown' },
        formDef: Core.defineForm({
          form: [
            {
              uid: 'md1',
              kind: 'input',
              type: 'markdown',
              path: 'sample',
            },
          ],
        }),
      });

      cy.get('[data-cy="md1_markdown"]').should('have.value', 'PARSED: Some markdown');
    });
  });
};
