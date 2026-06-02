/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { resolve } from 'node:path';
import { sharedMocksPlugin } from '../apps-shared/src/lib/utils/vite-mocks-plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/rob-demo',
  server: {
    port: 4221,
    host: 'localhost',
  },
  preview: {
    port: 4221,
    host: 'localhost',
  },
  plugins: [
    react(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin([
      '*.md',
      { glob: '**/*.json', input: '../../apps/apps-shared/src/lib/mocks', output: 'assets/mocks' },
    ]),
    sharedMocksPlugin(),
  ],
  build: {
    outDir: '../../dist/apps/rob-demo',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  resolve: {
    alias: {
      '@libs': resolve(__dirname, '../../libs'),
    },
  },
}));
