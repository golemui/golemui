import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { join } from 'path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/gui/schemas',
  plugins: [
    nxViteTsPaths(),
    nxCopyAssetsPlugin([
      '*.md',
      { input: 'src/lib', glob: '**/*.schema.json', output: 'schemas' },
      // The emitted index.d.ts imports the JSON files by their source-relative `./lib/...`
      // paths, so a copy must exist under lib/ or consumers cannot resolve the types.
      { input: 'src/lib', glob: '**/*.schema.json', output: 'lib' },
    ]),
    dts({
      entryRoot: 'src',
      tsconfigPath: join(__dirname, 'tsconfig.lib.json'),
      pathsToAliases: false,
    }),
  ],
  build: {
    outDir: '../../../dist/libs/gui/schemas',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: 'src/index.ts',
      name: 'gui-schemas',
      fileName: 'index',
    },
  },
  test: {
    name: 'gui-schemas',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/gui/schemas',
      provider: 'v8' as const,
    },
  },
}));
