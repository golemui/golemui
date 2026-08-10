import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/vite.config.{js,ts,mjs,mts}',
            '{projectRoot}/src/**/*.spec*.ts',
            '{projectRoot}/tools/**/*.ts',
            // Type-only import of @golemui/schemas. The rule reports it as a runtime
            // dependency either way, so the ignore stays and the build asserts instead:
            // see failOnForeignWorkspaceModules in vite.config.ts.
            '{projectRoot}/src/lib/widget-manifest.ts',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
