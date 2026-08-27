import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

// Server build config of the harness. The build-server target runs it. The
// inferred build target uses vite.config.mts.
export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/vue-ssr-harness-server',
  plugins: [
    vue({
      template: { compilerOptions: { isCustomElement: (tag: string) => tag.startsWith('gui-') } },
    }),
    nxViteTsPaths(),
  ],
  build: {
    ssr: 'src/entry-server.ts',
    outDir: '../../dist/apps/vue-ssr-harness/server',
    emptyOutDir: true,
    reportCompressedSize: false,
  },
}));
