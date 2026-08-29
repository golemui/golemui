/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { join } from 'path';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

// React 18 version lock (REACT18=1): resolve the adapter against the lowest supported
// React version, not React 19. This alias only reaches vite-transformed source. The
// `require('react')` calls inside the react18 packages resolve natively, which the setup
// file below redirects.
const react18Alias = process.env.REACT18
  ? {
      resolve: {
        alias: [
          { find: /^react-dom\/client$/, replacement: 'react18-dom/client' },
          { find: /^react-dom\/server$/, replacement: 'react18-dom/server.node' },
          { find: /^react-dom$/, replacement: 'react18-dom' },
          { find: /^react\/jsx-dev-runtime$/, replacement: 'react18/jsx-dev-runtime' },
          { find: /^react\/jsx-runtime$/, replacement: 'react18/jsx-runtime' },
          { find: /^react$/, replacement: 'react18' },
        ],
      },
    }
  : {};

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/react',
  ...react18Alias,
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
    outDir: '../../dist/libs/react',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: 'src/index.ts',
      name: 'react',
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@golemui/core', '@golemui/dx'],
      output: {
        // Marks the published ES entry as a client module for React Server Component
        // bundlers (Next.js App Router). Has no effect anywhere else
        banner: '"use client";',
      },
    },
  },
  test: {
    name: 'react',
    watch: false,
    globals: true,
    environment: 'node',
    // The runtime part of the React 18 version lock, see react18Alias above.
    setupFiles: process.env.REACT18 ? ['./react18-test-setup.ts'] : [],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/libs/react',
      provider: 'v8' as const,
    },
  },
}));
