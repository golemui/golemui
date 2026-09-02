import analog from '@analogjs/platform';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: ['es2022'],
  },
  // Server-side rendering is on by default: every page renders on request, and `/` is
  // prerendered at build time.
  plugins: [analog()],
});
