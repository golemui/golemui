import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/tanstack-playground',
  server: { port: 4100, strictPort: true },
  preview: { port: 4100, strictPort: true },
  // TanStack Start writes the client and server bundles to client/ and server/ under outDir.
  build: { outDir: '../../dist/apps/tanstack-playground', emptyOutDir: true },
  // The Start plugin must come before the React plugin. nxViteTsPaths resolves the
  // @golemui/* aliases to the lib sources (tsconfig.base.json paths).
  plugins: [nxViteTsPaths(), tanstackStart(), react()],
});
