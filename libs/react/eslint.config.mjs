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
          ignoredFiles: ['{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}'],
          ignoredDependencies: [
            '@nx/vite',
            'vite',
            'vite-plugin-dts',
            '@nx/dependency-checks',
            '@vitejs/plugin-react',
            // No shipped file imports react-dom, but the components render DOM and
            // custom elements, so they only run under it. The peer range is also
            // the react-dom range the hydration and server-render specs cover.
            'react-dom',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
