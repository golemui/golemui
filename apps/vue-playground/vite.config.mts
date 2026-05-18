/// <reference types='vitest' />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { sharedMocksPlugin } from '../apps-shared/src/lib/utils/vite-mocks-plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/vue-playground',
  server: {
    port: 3500,
    host: 'localhost',
  },
  preview: {
    port: 4500,
    host: 'localhost',
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag: string) => tag.startsWith('gui-'),
        },
      },
    }),
    nxViteTsPaths(),
    nxCopyAssetsPlugin([
      '*.md',
      { glob: '**/*.json', input: '../../apps/apps-shared/src/lib/mocks', output: 'assets/mocks' },
    ]),
    sharedMocksPlugin(),
  ],
  build: {
    outDir: '../../dist/apps/vue-playground',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
