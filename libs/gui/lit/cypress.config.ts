import { defineConfig } from 'cypress';

export default defineConfig({
  component: {
    devServer: {
      framework: 'cypress-ct-lit' as any,
      bundler: 'vite',
    },
    specPattern: ['cypress/test/**/*.cy.ts'],
    screenshotsFolder: '../../../dist/cypress/libs/gui/lit/screenshots/',
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
