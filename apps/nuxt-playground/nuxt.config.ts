import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

// Every @golemui/* package resolves to workspace source through the tsconfig.base.json paths.
// The Nuxt generated tsconfig does not extend tsconfig.base.json, so the same map is handed to
// the type checker, with targets relative to the generated `.nuxt/` directory like Nuxt's own
// aliases. Vite resolves the packages through nxViteTsPaths, on both the client and the server
// build. The file is read rather than imported: a relative import of a workspace root file is a
// module boundary violation for the linter.
const workspaceRoot = fileURLToPath(new URL('../../', import.meta.url));
const baseTsconfig = JSON.parse(readFileSync(`${workspaceRoot}tsconfig.base.json`, 'utf8')) as {
  compilerOptions: { paths: Record<string, string[]> };
};
const paths = Object.fromEntries(
  Object.entries(baseTsconfig.compilerOptions.paths).map(([alias, targets]) => [
    alias,
    targets.map((target) => `../../../${target}`),
  ]),
);

export default defineNuxtConfig({
  compatibilityDate: '2026-08-28',
  ssr: true,
  telemetry: false,
  // Other playgrounds: 3300 lit, 3500 vue, 3600 vue-ssr-harness, 8080 react.
  devServer: { port: 3700 },
  app: {
    head: {
      title: 'NuxtPlayground',
      // data-theme is the GolemUI theme hook, same as index.html in the other playgrounds.
      htmlAttrs: { lang: 'en', 'data-theme': 'auto' },
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' },
      ],
    },
  },
  css: ['~/assets/styles.scss'],
  // Needed here because the workspace compiles the gui-vue SFCs from source and the JSON page uses
  // a raw <gui-select>; an app on the published packages only needs this for its own gui-* tags.
  vue: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('gui-') } },
  vite: {
    plugins: [nxViteTsPaths()],
    build: { commonjsOptions: { transformMixedEsModules: true } },
  },
  // Keep the build output next to the other apps. `.nuxt` stays in the project root.
  nitro: {
    output: { dir: fileURLToPath(new URL('../../dist/apps/nuxt-playground', import.meta.url)) },
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        paths,
        // The lib sources are checked as part of this app. Match the flags the other Vue
        // playgrounds pass vue-tsc with: Lit components use legacy decorators.
        experimentalDecorators: true,
        noUncheckedIndexedAccess: false,
        verbatimModuleSyntax: false,
      },
    },
  },
});
