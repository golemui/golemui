import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

// One config for both builds of the harness.
// `vite build` emits the client bundle plus an index.html that already links the hashed
// script and style, which is what the production server uses as its template.
// `vite build --ssr src/entry-server.ts` emits the server bundle. Vite sets isSsrBuild for it.
export default defineConfig(({ isSsrBuild }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/vue-ssr-harness',
  plugins: [
    vue({
      template: { compilerOptions: { isCustomElement: (tag: string) => tag.startsWith('gui-') } },
    }),
    nxViteTsPaths(),
  ],
  build: {
    outDir: isSsrBuild
      ? '../../dist/apps/vue-ssr-harness/server'
      : '../../dist/apps/vue-ssr-harness/client',
    emptyOutDir: true,
    reportCompressedSize: !isSsrBuild,
    commonjsOptions: { transformMixedEsModules: true },
  },
}));
