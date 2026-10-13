/// <reference types='vitest' />
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
import { join } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/gui/ink',
  plugins: [
    react(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    dts({
      entryRoot: 'src',
      tsconfigPath: join(__dirname, 'tsconfig.lib.json'),
      pathsToAliases: false,
    }),
  ],
  build: {
    outDir: '../../../dist/libs/gui/ink',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: 'src/index.ts',
      name: 'gui-ink',
      fileName: 'index',
      // No terminal host loads UMD, and the UMD output would copy node builtins into the bundle.
      formats: ['es' as const],
    },
    rollupOptions: {
      // No "use client" banner: this bundle never runs in a React Server Components host.
      external: [
        'react',
        'react/jsx-runtime',
        'ink',
        '@golemui/core',
        '@golemui/react',
        '@golemui/gui-shared',
        '@golemui/gui-validators',
        /^@golemui\/gui-shared\/.+/,
        // Vite builds a library for a browser by default and would replace a node builtin with a
        // stub that throws at import time.
        /^node:/,
      ],
    },
  },
  test: {
    name: 'gui-ink',
    // Ink asks chalk whether the terminal has colors, and a spec reads focus from the inverse
    // video of the frame. Without this the frames arrive plain and every focus assertion fails.
    env: { FORCE_COLOR: '1' },
    watch: false,
    passWithNoTests: true,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/gui/ink',
      provider: 'v8' as const,
    },
  },
}));
