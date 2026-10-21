import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

// A page per element, in plain HTML: the elements on their own, with no framework and no form.
const pages = ['dialog', 'index', 'menu', 'pickers', 'popover', 'slider', 'toast', 'tooltip'];

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/components-playground',
  server: {
    port: 3700,
    host: 'localhost',
  },
  // The built pages, under the policy a careful app ships: no inline styles or scripts at all, so
  // an element that writes a style attribute breaks visibly (and logs the violation).
  preview: {
    port: 4700,
    host: 'localhost',
    headers: { 'Content-Security-Policy': "default-src 'self'" },
  },
  plugins: [nxViteTsPaths()],
  build: {
    outDir: '../../dist/apps/components-playground',
    emptyOutDir: true,
    reportCompressedSize: true,
    rollupOptions: {
      input: Object.fromEntries(pages.map((page) => [page, resolve(__dirname, `${page}.html`)])),
    },
  },
}));
