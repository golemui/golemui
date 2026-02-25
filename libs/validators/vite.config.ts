import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import * as path from 'path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/validators-vanilla',
  plugins: [
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
      pathsToAliases: false,
    }),
  ],
  // Configuration for building your library.
  build: {
    outDir: '../../dist/libs/validators-vanilla',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: 'src/index.ts',
      name: 'validators-vanilla',
      fileName: 'index',
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: ['@golemui/core', '@standard-schema/spec', 'zod', 'zod/mini'],
    },
  },
  test: {
    name: 'validators-vanilla',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/libs/validators-vanilla',
      provider: 'v8' as const,
    },
  },
}));
