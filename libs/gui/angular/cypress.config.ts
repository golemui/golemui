import { nxComponentTestingPreset } from '@nx/angular/plugins/component-testing';
import { defineConfig } from 'cypress';

export default defineConfig({
  component: {
    ...nxComponentTestingPreset(__filename),
    specPattern: ['cypress/test/**/*.cy.ts'],
    numTestsKeptInMemory: 0,
    video: false,
  },
});
