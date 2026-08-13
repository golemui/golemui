import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig, type Plugin } from 'vite';
import dts from 'vite-plugin-dts';
import { join, sep } from 'path';

/**
 * Fails the build if code from another workspace library reaches an emitted bundle. The only
 * @golemui import in this package is the type-only one in src/lib/widget-manifest.ts, which
 * is excluded from the lib build. Checking bundled module paths rather than import
 * statements is what catches it: the tsconfig path aliases resolve a workspace package to
 * its source, so a value import would be inlined instead of left as a runtime import.
 */
function failOnForeignWorkspaceModules(): Plugin {
  const projectRoot = `${__dirname}${sep}`;
  return {
    name: 'gui-schemas-fail-on-foreign-workspace-modules',
    generateBundle(_options, bundle) {
      for (const [fileName, output] of Object.entries(bundle)) {
        if (output.type !== 'chunk') {
          continue;
        }
        const foreign = Object.keys(output.modules).filter(
          (id) => id.includes(`${sep}libs${sep}`) && !id.startsWith(projectRoot),
        );
        if (foreign.length > 0) {
          this.error(
            `${fileName} bundles ${foreign.length} module(s) from another workspace library, ` +
              `starting with ${foreign[0]}. @golemui/gui-schemas must ship only its own sources.`,
          );
        }
      }
    },
  };
}

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/libs/gui/schemas',
  plugins: [
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md', { input: 'src/lib', glob: '**/*.schema.json', output: 'schemas' }]),
    dts({
      entryRoot: 'src',
      tsconfigPath: join(__dirname, 'tsconfig.lib.json'),
      pathsToAliases: false,
    }),
    failOnForeignWorkspaceModules(),
  ],
  build: {
    outDir: '../../../dist/libs/gui/schemas',
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: 'src/index.ts',
      name: 'gui-schemas',
      fileName: 'index',
    },
  },
  test: {
    name: 'gui-schemas',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/gui/schemas',
      provider: 'v8' as const,
    },
  },
}));
