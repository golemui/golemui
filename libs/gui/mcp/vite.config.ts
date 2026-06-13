import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { join } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/gui/mcp',
  plugins: [
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    dts({
      entryRoot: 'src',
      tsconfigPath: join(__dirname, 'tsconfig.lib.json'),
      pathsToAliases: false,
    }),
  ],
  build: {
    outDir: '../../../dist/libs/gui/mcp',
    emptyOutDir: true,
    reportCompressedSize: true,
    target: 'node18',
    ssr: true,
    lib: {
      entry: {
        lib: 'src/lib.ts', // library - no server, importable anywhere
        cli: 'src/cli.ts', // MCP stdio server - Node.js only
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        /^@modelcontextprotocol\/sdk(\/.*)?$/,
        /^ajv(\/.*)?$/,
        'ajv-formats',
        // `typescript` is loaded lazily by the DX type-check only — keep it external
        // so the JSON path never pulls the compiler into its bundle.
        'typescript',
        'node:fs',
        'node:module',
        'node:path',
        'node:url',
      ],
      output: {
        // shebang only on the CLI bundle
        banner: (chunk) => (chunk.name === 'cli' ? '#!/usr/bin/env node' : ''),
      },
    },
  },
  test: {
    name: 'gui-mcp',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    // dx_check_code / dx-specs run a real `tsc` compile against the full @golemui type graph;
    // the cold program init is several seconds, more on slower CI runners. The 5s vitest default
    // times them out on CI — give the compile-based tests room.
    testTimeout: 30000,
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/gui/mcp',
      provider: 'v8' as const,
    },
  },
}));
