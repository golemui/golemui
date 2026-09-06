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
            // Repository-only generator scripts, not part of the published package.
            '{projectRoot}/tools/**',
          ],
          // Option-B deps: declared for the published package, resolved from node_modules by the
          // in-process tsc gate (typecheck.ts) rather than statically imported, so dep-checks can't see them.
          ignoredDependencies: [
            'vitest',
            '@golemui/core',
            '@golemui/gui-shared',
            '@golemui/gui-validators',
            'zod',
            '@standard-schema/spec',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
