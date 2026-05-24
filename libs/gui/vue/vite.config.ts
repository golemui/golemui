/// <reference types='vitest' />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { join } from 'path';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/gui/vue',
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag: string) => tag.startsWith('gui-'),
        },
      },
    }),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    dts({
      entryRoot: 'src',
      tsconfigPath: join(__dirname, 'tsconfig.lib.json'),
      pathsToAliases: false,
    }),
  ],
  build: {
    outDir: '../../../dist/libs/gui/vue',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: 'src/index.ts',
      name: 'gui-vue',
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'vue',
        '@golemui/core',
        '@golemui/vue',
        '@golemui/gui-components',
        '@golemui/gui-shared',
        '@golemui/gui-validators',
        /^@golemui\/gui-components\/.+/,
        /^@golemui\/gui-shared\/.+/,
      ],
    },
  },
  test: {
    name: 'gui-vue',
    watch: false,
    passWithNoTests: true,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/gui/vue',
      provider: 'v8' as const,
    },
  },
}));
