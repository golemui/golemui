import { nxComponentTestingPreset } from '@nx/react/plugins/component-testing';
import { defineConfig } from 'cypress';
import { fileURLToPath } from 'node:url';

const configFilename = fileURLToPath(import.meta.url);

export default defineConfig({
  component: {
    ...nxComponentTestingPreset(configFilename, { bundler: 'vite' }),
    specPattern: ['cypress/test/**/*.cy.ts'],
    numTestsKeptInMemory: 0,
    video: false,
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--disable-gpu');
        }
        return launchOptions;
      });
      return config;
    },
  },
});
