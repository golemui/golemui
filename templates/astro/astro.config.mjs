import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Render every page on request. With the default `output: 'static'` the same Lit render
  // runs once, at build time, and `@astrojs/node` is not needed.
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});
