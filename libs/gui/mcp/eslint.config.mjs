import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    // Built by the nx target generate-validators, not hand-written.
    ignores: ['**/schemas/generated/**/*.js'],
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/vite.config.{js,ts,mjs,mts}',
            // Repository-only generator scripts, not part of the published package.
            '{projectRoot}/tools/**',
          ],
          ignoredDependencies: ['vitest'],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
