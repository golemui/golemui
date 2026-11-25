/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/gui/angular',
  plugins: [angular(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  // The angular plugin forces browser resolve conditions onto every environment. The
  // node-environment server specs must resolve the node builds of lit instead, like a
  // real Node server does.
  environments: {
    ssr: {
      resolve: {
        conditions: ['node', 'module', 'import', 'default'],
      },
    },
  },
  test: {
    name: 'gui-angular',
    watch: false,
    passWithNoTests: true,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    // Vite, not Node's module linker, loads Lit. The loader spec imports every widget at once,
    // and Node fails to link Lit for an element that imports only \`lit/decorators.js\` (tab,
    // multi-list, range-calendar) while another element is linking \`lit\`.
    server: {
      deps: { inline: [/[\\/]node_modules[\\/](lit|lit-html|lit-element|@lit|@lit-labs)[\\/]/] },
    },
    coverage: {
      reportsDirectory: '../../coverage/libs/gui/angular',
      provider: 'v8' as const,
    },
  },
}));
