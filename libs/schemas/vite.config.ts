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
      entry: {
        index: 'src/index.ts',
        generator: 'src/generator.ts',
        cli: 'src/cli/index.ts',
      },
      // Multiple entries rule out umd. The generator and the CLI are node build-time
      // tools, and nothing loads this package through a script tag.
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      // Prettier is an optional peer dependency the generator imports at run time.
      external: [/^node:/, 'prettier'],
      output: {
        // Only the bin is executed directly, and a shebang in the shared chunks would
        // land in the middle of a file.
        banner: (chunk) => (chunk.name === 'cli' ? '#!/usr/bin/env node' : ''),
      },
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
