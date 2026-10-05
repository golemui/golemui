import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { join } from 'path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/lit-utils',
  plugins: [
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    dts({
      entryRoot: 'src',
      tsconfigPath: join(__dirname, 'tsconfig.lib.json'),
      pathsToAliases: false,
    }),
  ],
  // Configuration for building your library.
  build: {
    outDir: '../../dist/libs/lit-utils',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: {
        index: 'src/index.ts',
        ssr: 'src/ssr.ts',
      },
      name: 'lit-utils',
      formats: ['es', 'cjs'],
      fileName: (format: string, entryName: string) =>
        format === 'cjs' ? `${entryName}.umd.cjs` : `${entryName}.js`,
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: ['lit', /^lit\//, /^@lit-labs\/ssr($|\/)/, 'parse5'],
    },
  },
  test: {
    name: 'lit-utils',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/libs/lit-utils',
      provider: 'v8' as const,
    },
  },
}));
