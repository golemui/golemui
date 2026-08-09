import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { join } from 'path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/schemas',
  plugins: [
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md', { input: 'src/lib', glob: '**/*.schema.json', output: 'schemas' }]),
    dts({
      entryRoot: 'src',
      tsconfigPath: join(__dirname, 'tsconfig.lib.json'),
      pathsToAliases: false,
    }),
  ],
  build: {
    outDir: '../../dist/libs/schemas',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: 'src/index.ts',
      name: 'schemas',
      fileName: 'index',
    },
  },
  test: {
    name: 'schemas',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/libs/schemas',
      provider: 'v8' as const,
    },
  },
}));
