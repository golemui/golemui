import { nxComponentTestingPreset } from '@nx/angular/plugins/component-testing';
import { defineConfig } from 'cypress';

export default defineConfig({
  component: {
    ...nxComponentTestingPreset(__filename),
    specPattern: ['cypress/test/**/*.cy.ts'],
    numTestsKeptInMemory: 0,
    video: false,
    // Docker containers (which GitHub Actions runners use) often have a very
    // small /dev/shm (shared memory) partition, usually only 64MB.
    // Chrome uses this space for its rendering process. When it runs out, Chrome crashes instantly.
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
