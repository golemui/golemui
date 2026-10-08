import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);

/**
 * Writes a library's Custom Elements Manifest (`custom-elements.json`) into its package, from the
 * `custom-elements-manifest.config.mjs` in the library root. It runs on `closeBundle` because
 * `emptyOutDir` wipes the output directory at the start of every Vite build.
 *
 * @param projectRoot - The library root, which holds the analyzer config.
 */
export function customElementsManifest(projectRoot: string): Plugin {
  let outDir: string;

  return {
    name: 'golemui:custom-elements-manifest',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const cli = join(
        dirname(require.resolve('@custom-elements-manifest/analyzer/package.json')),
        'cem.js',
      );
      // The analyzer resolves its globs and --outdir against the working directory.
      execFileSync(
        process.execPath,
        [
          cli,
          'analyze',
          '--config',
          'custom-elements-manifest.config.mjs',
          '--outdir',
          relative(projectRoot, outDir),
          '--quiet',
        ],
        { cwd: projectRoot, stdio: 'inherit' },
      );
    },
  };
}
