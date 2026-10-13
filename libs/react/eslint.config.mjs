import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            // Test-only widgets for the Ink render spec. The library never imports `ink`.
            '{projectRoot}/src/lib/ink.fixture.tsx',
          ],
          ignoredDependencies: [
            '@nx/vite',
            'vite',
            'vite-plugin-dts',
            '@nx/dependency-checks',
            '@vitejs/plugin-react',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
