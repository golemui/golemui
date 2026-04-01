import { nxComponentTestingPreset } from '@nx/react/plugins/component-testing';
import { defineConfig } from 'cypress';

export default defineConfig({
  component: {
    ...nxComponentTestingPreset(__filename, { bundler: 'vite' }),
    specPattern: ['cypress/test/**/*.cy.ts'],
    numTestsKeptInMemory: 0,
    video: false,
  },
});
