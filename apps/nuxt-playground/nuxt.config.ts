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
  vue: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('gui-') } },
  vite: {
    plugins: [nxViteTsPaths()],
    build: { commonjsOptions: { transformMixedEsModules: true } },
  },
  nitro: {
    output: { dir: fileURLToPath(new URL('../../dist/apps/nuxt-playground', import.meta.url)) },
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
