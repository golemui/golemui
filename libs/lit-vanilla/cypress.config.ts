import { defineConfig } from 'cypress';

export default defineConfig({
  component: {
    devServer: {
      framework: 'cypress-ct-lit' as any,
      bundler: 'vite',
    },
    screenshotsFolder: '../../dist/cypress/libs/lit-vanilla/screenshots/',
  },
});
