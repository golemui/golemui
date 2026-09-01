import node from '@astrojs/node';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'astro/config';

// The server bundles land in dist/apps, so their bare imports resolve from the workspace root
// node_modules, where other tooling pins older copies of these packages than the ones Astro's
// runtime imports named exports from (nested under astro). Bundling them keeps the copies
// Astro was built against. Same class of problem as https://github.com/withastro/astro/issues/17508.
const shadowedAstroDeps = ['cookie', 'html-escaper'];

export default defineConfig({
  // Every page is rendered on demand by the Node adapter, except the ones that opt out with
  // `export const prerender = true` (those run the same Lit render at build time).
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  outDir: '../../dist/apps/astro-playground',
  // Other playgrounds: 3300 lit, 3500 vue, 3602 lit-ssr-harness, 3700 nuxt, 3800 nextjs.
  server: { port: 3900 },
  // The toolbar injects its own scripts and styles into every page; keep the served markup
  // limited to what the Lit render produced.
  devToolbar: { enabled: false },
  vite: {
    // The @golemui/* aliases resolve to lib TS source (tsconfig.base.json paths), on both the
    // client and the server side of the build.
    plugins: [nxViteTsPaths()],
    // `ssr.noExternal` only reaches the request-time bundle; the prerender pass is its own
    // Vite environment and needs the list too.
    ssr: { noExternal: shadowedAstroDeps },
    environments: { prerender: { resolve: { noExternal: shadowedAstroDeps } } },
  },
});
