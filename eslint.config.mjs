import nx from '@nx/eslint-plugin';
import importPlugin from 'eslint-plugin-import';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
      '**/docs/src/examples/**',
      'templates/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // Tags direction
      // ------------------------
      //  scope:app ----> scope:framework ------> scope:gui -----> scope:core
      //  apps/           react/lit/angular       gui-shared       core
      //  docs/           gui-react/lit/angular   gui-components   gui-validators
      //                  ui-testing
      //
      // |------------------------------------------------------------------------------------------------|
      // | Tag             | Projects                                                                     |
      // |------------------------------------------------------------------------------------------------|
      // | scope:core      | @golemui/core, gui-validators                                                |
      // | scope:gui       | @golemui/gui-shared, gui-components                                          |
      // | scope:framework | @golemui/react/lit/angular, gui-react/lit/angular, ui-testing                |
      // | scope:app       | everything under apps/ and docs/                                             |
      // |------------------------------------------------------------------------------------------------|
      // ( type:app projects cannot import @golemui/*/internals )
      //
      // Notes
      // ------------------------
      // - ui-testing is tagged scope:framework so both framework and app scopes can import it in tests
      // - apps-shared is intentionally type:lib (not type:app), so the /internals ban does not apply to it
      // ------------------------
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            { sourceTag: 'type:app', bannedExternalImports: ['@golemui/*/internals'] },
            { sourceTag: 'scope:core', onlyDependOnLibsWithTags: ['scope:core'] },
            { sourceTag: 'scope:gui', onlyDependOnLibsWithTags: ['scope:core', 'scope:gui'] },
            {
              sourceTag: 'scope:framework',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:gui', 'scope:framework'],
            },
            {
              sourceTag: 'scope:app',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:gui', 'scope:framework', 'scope:app'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    plugins: {
      import: importPlugin,
    },
    // Override or add rules here
    rules: {
      'import/no-namespace': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // vite/vitest legitimately reference sibling workspace packages by relative path and don't need module-boundary enforcement
    files: ['**/vite.config.*', '**/vitest.config.*'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
  {
    files: ['**/cypress/support/component.ts'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
];
