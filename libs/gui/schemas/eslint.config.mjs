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
            // Type-only import of @golemui/schemas, excluded from the lib build output, so it
            // must not force a runtime dependency in package.json.
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
