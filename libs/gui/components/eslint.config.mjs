import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    // GolemUI Components is usable without the form engine: Forms depends on it, never the
    // other way round, and `lit` is its only peer dependency.
    files: ['**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@golemui/*', '!@golemui/lit-utils'],
              message: 'gui-components must not import @golemui packages other than lit-utils.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/src/**/*.spec*.ts',
          ],
          ignoredDependencies: [
            '@nx/vite',
            'vite',
            'vite-plugin-dts',
            'sass',
            '@nx/dependency-checks',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
