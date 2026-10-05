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
  // Port registry for every app: CONTRIBUTING.md, "Playground and harness ports".
  devServer: { port: 3614 },
  app: {
    head: {
      title: 'GolemUI Components: Nuxt server rendering',
      // data-theme is the GolemUI theme hook, same as index.html in the other playgrounds.
      htmlAttrs: { lang: 'en', 'data-theme': 'auto' },
    },
  },
  css: ['~/assets/styles.scss'],
  vue: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('gui-') } },
  vite: {
    plugins: [nxViteTsPaths()],
    build: { commonjsOptions: { transformMixedEsModules: true } },
  },
  nitro: {
    output: { dir: fileURLToPath(new URL('../../dist/apps/components-ssr-nuxt', import.meta.url)) },
    // The Nitro plugin (server/plugins/golemui.ts) is bundled by Nitro, not Vite, so it needs the
    // workspace sources aliased too. An app installs the package instead.
    alias: {
      '@golemui/gui-components/ssr': `${workspaceRoot}libs/gui/components/src/ssr.ts`,
      '@golemui/lit-utils/ssr': `${workspaceRoot}libs/lit-utils/src/ssr.ts`,
    },
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
