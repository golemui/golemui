import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { compile } from 'sass';
import type { Plugin } from 'vite';

/**
 * Compiles a library's public stylesheets into its package. It runs on `closeBundle` because
 * `emptyOutDir` wipes the output directory at the start of every Vite build.
 *
 * @param projectRoot - The library root the source paths are relative to.
 * @param styles - Source `.scss` path to output `.css` path, relative to the output directory.
 */
export function compileStyles(projectRoot: string, styles: Record<string, string>): Plugin {
  let outDir: string;

  return {
    name: 'golemui:compile-styles',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      for (const [source, target] of Object.entries(styles)) {
        const file = join(outDir, target);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, compile(join(projectRoot, source)).css + '\n');
      }
    },
  };
}
