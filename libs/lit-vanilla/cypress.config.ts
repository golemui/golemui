import { defineConfig } from 'cypress';

export default defineConfig({
  component: {
    devServer: {
      framework: 'cypress-ct-lit' as any,
      bundler: 'vite',
    },
    specPattern: ['cypress/test/**/*.cy.ts'],
    screenshotsFolder: '../../dist/cypress/libs/lit-vanilla/screenshots/',
  },
});
