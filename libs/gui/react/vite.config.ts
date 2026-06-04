/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { join, resolve } from 'path';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

// React 18 pin (REACT18=1): resolve the adapter against the advertised floor, not React 19.
const react18Alias = process.env.REACT18
  ? {
      resolve: {
        alias: {
          'react-dom/client': resolve(__dirname, '../../../node_modules/react18-dom/client.js'),
          'react-dom': resolve(__dirname, '../../../node_modules/react18-dom/index.js'),
          'react/jsx-dev-runtime': resolve(__dirname, '../../../node_modules/react18/jsx-dev-runtime.js'),
          'react/jsx-runtime': resolve(__dirname, '../../../node_modules/react18/jsx-runtime.js'),
          react: resolve(__dirname, '../../../node_modules/react18/index.js'),
        },
      },
    }
  : {};

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/gui/react',
  ...react18Alias,
  plugins: [
    react(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    dts({
      entryRoot: 'src',
      tsconfigPath: join(__dirname, 'tsconfig.lib.json'),
      pathsToAliases: false,
    }),
  ],
  build: {
    outDir: '../../../dist/libs/gui/react',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: 'src/index.ts',
      name: 'gui-react',
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@lit/react',
        '@golemui/core',
        '@golemui/react',
        '@golemui/gui-components',
        '@golemui/gui-shared',
      ],
    },
  },
  test: {
    name: 'gui-react',
    watch: false,
    passWithNoTests: true,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/gui/react',
      provider: 'v8' as const,
    },
  },
}));
