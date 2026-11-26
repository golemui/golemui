/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import dts from 'vite-plugin-dts';
import { join } from 'path';
import { compileStyles } from '../../../tools/vite/compile-styles';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/gui/shared',
  plugins: [
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    dts({
      entryRoot: 'src',
      tsconfigPath: join(__dirname, 'tsconfig.lib.json'),
      pathsToAliases: false,
    }),
    compileStyles(__dirname, { 'src/styles/forms.scss': 'forms.css' }),
  ],
  // Configuration for building your library.
  build: {
    outDir: '../../../dist/libs/gui/shared',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: {
        index: 'src/index.ts',
        internals: 'src/internals.ts',
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        format === 'cjs' ? `${entryName}.umd.cjs` : `${entryName}.js`,
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [
        '@golemui/core',
        /^@golemui\/core\/.+/,
        '@golemui/gui-components',
        /^@golemui\/gui-components\/.+/,
        '@golemui/gui-validators',
      ],
    },
  },
  test: {
    name: 'gui-shared',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Runs `tsc --noEmit` over the specs that check types, so a type error in them, or a
    // `@ts-expect-error` probe that compiles without an error, fails the vite:test CI step.
    // esbuild erases the types, so without this check these specs assert nothing about types.
    // The dedicated tsconfig keeps the checked program down to these specs and the entry
    // points they import.
    typecheck: {
      enabled: true,
      include: ['src/dependency-types.spec.ts', 'src/lib/golem-form.spec.ts'],
      tsconfig: 'tsconfig.dependency-types.json',
    },
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/gui/shared',
      provider: 'v8' as const,
    },
  },
}));
