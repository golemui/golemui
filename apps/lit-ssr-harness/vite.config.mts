import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

// One config for both builds of the harness.
// `vite build` emits the client bundle plus an index.html that already links the hashed
// script and style, which is what the production server uses as its template.
// `vite build --ssr src/entry-server.ts` emits the server bundle. Vite sets isSsrBuild for it.
// No framework plugin: the widgets are custom elements, so the harness compiles plain TypeScript.
export default defineConfig(({ isSsrBuild }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/lit-ssr-harness',
  plugins: [nxViteTsPaths()],
  build: {
    outDir: isSsrBuild
      ? '../../dist/apps/lit-ssr-harness/server'
      : '../../dist/apps/lit-ssr-harness/client',
    emptyOutDir: true,
    reportCompressedSize: !isSsrBuild,
    commonjsOptions: { transformMixedEsModules: true },
  },
}));
