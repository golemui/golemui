import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  build: {
    outDir: '../public/template',
    emptyOutDir: true,
  },
});
