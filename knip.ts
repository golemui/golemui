// Knip config `npx knip --dependencies`
const config = {
  entry: [
    // Apps (playgrounds)
    'apps/*/src/main.{ts,tsx}',
    'apps/apps-shared/src/index.ts',
    // Publishable libs
    'libs/**/src/index.ts',
    // MCP server CLI (not exported through index.ts)
    'libs/**/src/cli.ts',
    // Test setup and Cypress support files
    '**/src/test-setup.ts',
    'libs/**/cypress/support/**/*.ts',
    'libs/**/cypress/test/**/*.cy.ts',
    // Tooling and scripts
    'tools/**/*.ts',
    // Config files that import dependencies
    '**/vite.config.{ts,mts}',
    '**/vitest.config.{ts,mts}',
    '**/cypress.config.ts',
    '**/eslint.config.{js,mjs,cjs}',
    'vitest.workspace.ts',
  ],
  project: [
    'apps/**/*.{ts,tsx,js,vue,html}',
    'libs/**/*.{ts,tsx,js,vue,html}',
    'tools/**/*.ts',
  ],
  // Knip does not parse .vue files by default: extract the <script> blocks
  compilers: {
    vue: (text: string) =>
      [...text.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
        .map((m) => m[1])
        .join('\n'),
  },
  // Used by Nx executors / Angular CLI / tooling, never imported in source code:
  ignoreDependencies: [
    '@angular-devkit/.*',
    '@angular/build',
    '@angular/cli',
    '@angular/compiler-cli',
    '@angular/language-service',
    '@nx/.*',
    '@schematics/angular',
    '@swc-node/register',
    '@swc/.*',
    'ng-packagr',
    'angular-eslint',
    // referenced in tsconfig.lib.json (plugins), knip cannot detect it
    'ts-lit-plugin',
    // Peer deps loaded by name by nx.configs['flat/react'] in eslint:
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'eslint-plugin-jsx-a11y',
    // Loaded at runtime by the Angular component testing harness (TestBed):
    '@angular/platform-browser-dynamic',
    // Invoked by name by the Vue tooling (typecheck/build), no direct import:
    'vue-tsc',
    // Peer dependency of angular-eslint (^8.0.0), must live in the root:
    'typescript-eslint',
    'czg',
    'prettier',
    'verdaccio',
    'tslib',
    'zone.js',
    'react18',
    'react18-dom',
  ],
};

export default config;
