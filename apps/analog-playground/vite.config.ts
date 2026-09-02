import analog from '@analogjs/platform';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// The Analog platform plugin compiles the components and must come before the path plugin.
// Playground ports: 3300 lit, 3500 vue, 3700 nuxt, 3800 nextjs, 3900 astro, 4200 angular.
export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/analog-playground',
  server: { port: 4000 },
  build: {
    // With workspaceRoot set, Analog anchors the ssr/, analog/ and .nitro/ outputs under
    // dist/apps/analog-playground; the client build has to be pointed there explicitly.
    outDir: '../../dist/apps/analog-playground/client',
    emptyOutDir: true,
    target: ['es2022'],
    commonjsOptions: { transformMixedEsModules: true },
  },
  plugins: [
    analog({
      workspaceRoot: resolve(__dirname, '../..'),
      // Same split as the Astro playground: the landing page and the modular form are
      // rendered once at build time, the two kitchen sinks render on every request.
      prerender: { routes: ['/', '/dx/modular'], discover: false },
    }),
    nxViteTsPaths(),
  ],
}));
