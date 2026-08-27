import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

// Client build config of the harness. The server build config is vite.config.server.mts.
// index.html is the build input. The emitted index.html already contains the hashed
// script and style links, so the production server uses it as its template.
export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/vue-ssr-harness',
  plugins: [
    vue({
      template: { compilerOptions: { isCustomElement: (tag: string) => tag.startsWith('gui-') } },
    }),
    nxViteTsPaths(),
  ],
  build: {
    outDir: '../../dist/apps/vue-ssr-harness/client',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: { transformMixedEsModules: true },
  },
}));
