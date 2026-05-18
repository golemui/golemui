import { defineConfig } from 'cypress';
import vue from '@vitejs/plugin-vue';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
      viteConfig: {
        plugins: [
          vue({
            template: {
              compilerOptions: {
                isCustomElement: (tag: string) => tag.startsWith('gui-'),
              },
            },
          }),
          nxViteTsPaths(),
        ],
      },
    },
    specPattern: ['cypress/test/**/*.cy.ts'],
    screenshotsFolder: '../../../dist/cypress/libs/gui/vue/screenshots/',
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
