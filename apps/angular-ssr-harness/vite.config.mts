import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

// One config for both builds of the harness.
// `vite build` emits the client bundle plus an index.html that already links the hashed
// script and style, which is what the production server uses as its template.
// `vite build --ssr src/entry-server.ts` emits the server bundle. Vite sets isSsrBuild for it.
// The angular plugin compiles the components and must come before the path plugin.
export default defineConfig(({ isSsrBuild }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/angular-ssr-harness',
  plugins: [angular(), nxViteTsPaths()],
  ssr: {
    // The published @angular packages are partially compiled and need the Angular
    // linker, which runs inside the bundler pipeline. An externalized import skips the
    // linker and then fails at runtime because the JIT compiler is not loaded.
    noExternal: [/^@angular\//],
  },
  build: {
    outDir: isSsrBuild
      ? '../../dist/apps/angular-ssr-harness/server'
      : '../../dist/apps/angular-ssr-harness/client',
    emptyOutDir: true,
    reportCompressedSize: !isSsrBuild,
    commonjsOptions: { transformMixedEsModules: true },
  },
}));
