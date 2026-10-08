import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

// One config for both builds of the test app.
// `vite build` emits the client bundle plus an index.html that already links the hashed
// script and style, which is what the production server uses as its template.
// `vite build --ssr src/entry-server.tsx` emits the server bundle. Vite sets isSsrBuild for it.
export default defineConfig(({ isSsrBuild }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/components-ssr-react',
  plugins: [react(), nxViteTsPaths()],
  build: {
    outDir: isSsrBuild
      ? '../../dist/apps/components-ssr-react/server'
      : '../../dist/apps/components-ssr-react/client',
    emptyOutDir: true,
    reportCompressedSize: !isSsrBuild,
    commonjsOptions: { transformMixedEsModules: true },
  },
}));
