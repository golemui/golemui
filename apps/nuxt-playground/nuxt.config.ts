import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

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
  // The GolemUI module, from the workspace sources: an app lists '@golemui/gui-components/nuxt'.
  modules: [`${workspaceRoot}libs/gui/components/src/nuxt.ts`],
  // Port registry for every app: CONTRIBUTING.md, "Playground and harness ports".
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
  vite: {
    plugins: [nxViteTsPaths()],
    build: { commonjsOptions: { transformMixedEsModules: true } },
  },
  nitro: {
    output: { dir: fileURLToPath(new URL('../../dist/apps/nuxt-playground', import.meta.url)) },
    // The module's Nitro plugin is bundled by Nitro, not Vite, so it needs the workspace sources
    // aliased too. An app installs the package instead.
    // Nitro bundles the server assuming no module has side effects unless this list names it. Vite
    // compiles the workspace sources into chunks of Nuxt's server build, and Nitro would drop the
    // imports between them that only register an element (gui-calendar, gui-date, ...), so those
    // elements would stay empty in the server HTML. An app that installs the packages keeps them:
    // Nitro reads the packages' own sideEffects list.
    moduleSideEffects: [
      `${fileURLToPath(new URL('.', import.meta.url))}node_modules/.cache/nuxt/.nuxt/dist/server/`,
    ],
    alias: { '@golemui/lit-utils/ssr': `${workspaceRoot}libs/lit-utils/src/ssr.ts` },
    // The plugin type-checks those sources, which use the DOM types.
    typescript: { tsConfig: { compilerOptions: { lib: ['ESNext', 'DOM'] } } },
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        paths,
        experimentalDecorators: true,
        noUncheckedIndexedAccess: false,
        verbatimModuleSyntax: false,
      },
    },
  },
});
