import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { join } from 'path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/gui/components',
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
    outDir: '../../../dist/libs/gui/components',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: {
        index: 'src/index.ts',
        internals: 'src/internals.ts',
        'lib/components/button': 'src/lib/components/button.ts',
        'lib/components/calendar': 'src/lib/components/calendar.ts',
        'lib/components/checkbox': 'src/lib/components/checkbox.ts',
        'lib/components/currency': 'src/lib/components/currency.ts',
        'lib/components/date-input': 'src/lib/components/date-input.ts',
        'lib/components/date-picker': 'src/lib/components/date-picker.ts',
        'lib/components/date-time-calendar': 'src/lib/components/date-time-calendar.ts',
        'lib/components/date-time-input': 'src/lib/components/date-time-input.ts',
        'lib/components/date-time-picker': 'src/lib/components/date-time-picker.ts',
        'lib/components/errors': 'src/lib/components/errors.ts',
        'lib/components/file-upload': 'src/lib/components/file-upload.ts',
        'lib/components/label': 'src/lib/components/label.ts',
        'lib/components/list': 'src/lib/components/list.ts',
        'lib/components/markdown': 'src/lib/components/markdown.ts',
        'lib/components/markdown-text': 'src/lib/components/markdown-text.ts',
        'lib/components/multi-file-upload': 'src/lib/components/multi-file-upload.ts',
        'lib/components/multi-list': 'src/lib/components/multi-list.ts',
        'lib/components/multi-select-trigger': 'src/lib/components/multi-select-trigger.ts',
        'lib/components/number': 'src/lib/components/number.ts',
        'lib/components/password': 'src/lib/components/password.ts',
        'lib/components/pills': 'src/lib/components/pills.ts',
        'lib/components/radiogroup': 'src/lib/components/radiogroup.ts',
        'lib/components/range-calendar': 'src/lib/components/range-calendar.ts',
        'lib/components/range-date-input': 'src/lib/components/range-date-input.ts',
        'lib/components/range-date-time-input': 'src/lib/components/range-date-time-input.ts',
        'lib/components/range-date-time-calendar': 'src/lib/components/range-date-time-calendar.ts',
        'lib/components/range-date-time-picker': 'src/lib/components/range-date-time-picker.ts',
        'lib/components/range-time-input': 'src/lib/components/range-time-input.ts',
        'lib/components/range-date-picker': 'src/lib/components/range-date-picker.ts',
        'lib/components/range-time-picker': 'src/lib/components/range-time-picker.ts',
        'lib/components/select': 'src/lib/components/select.ts',
        'lib/components/tags': 'src/lib/components/tags.ts',
        'lib/components/textarea': 'src/lib/components/textarea.ts',
        'lib/components/textinput': 'src/lib/components/textinput.ts',
        'lib/components/time-input': 'src/lib/components/time-input.ts',
        'lib/components/time-list': 'src/lib/components/time-list.ts',
        'lib/components/time-picker': 'src/lib/components/time-picker.ts',
        'lib/components/toggle': 'src/lib/components/toggle.ts',
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        format === 'cjs' ? `${entryName}.umd.cjs` : `${entryName}.js`,
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      // `lit` must stay external so Node resolves lit's own `node` export condition.
      // Bundling it inlines the browser build, which reads `HTMLElement` at module scope.
      external: [
        '@golemui/core',
        '@golemui/gui-shared',
        '@golemui/lit',
        /^@golemui\/lit\/.+/,
        'lit',
        /^lit\/.+/,
        'lit-html',
        /^lit-html\/.+/,
      ],
    },
  },
  test: {
    name: 'gui-components',
    watch: false,
    passWithNoTests: true,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/gui/components',
      provider: 'v8' as const,
    },
  },
}));
