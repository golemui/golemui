import { defineConfig } from 'cypress';

export default defineConfig({
  component: {
    devServer: {
      framework: 'cypress-ct-lit' as any,
      bundler: 'vite',
    },
    specPattern: ['cypress/test/**/*.cy.ts'],
    screenshotsFolder: '../../../dist/cypress/libs/gui/components/screenshots/',
    numTestsKeptInMemory: 0,
    video: false,
    setupNodeEvents(on, config) {
      // Prints axe violations to the terminal, where a headless run shows them.
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
      });
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
