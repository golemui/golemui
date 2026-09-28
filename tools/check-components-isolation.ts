import { execSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Standalone install check for @golemui/gui-components.
 *
 * GolemUI Components must work without the form engine: it needs `lit` and its own
 * @golemui/lit-utils helpers, nothing else. This script packs both built packages, installs
 * them in an empty project next to `lit`, then imports the package root, one component entry
 * point and the stylesheet. An import of any other @golemui package fails there, because
 * none is installed.
 *
 * Run with `npm run test:components-isolation`. Pass `--skip-build` to reuse the existing
 * `dist` output.
 */

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
// lit-utils is packed too: until it is published, npm could not fetch it from the registry.
const packages = ['gui-components', 'lit-utils'];
const distDirs = [
  join(repoRoot, 'dist/libs/gui/components'),
  join(repoRoot, 'dist/libs/lit-utils'),
];

const run = (command: string, cwd: string) =>
  execSync(command, { cwd, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });

// Runs in Node, where lit's `node` export condition provides the DOM shim, so the elements
// register in the shim's registry.
const importCheck = `
import { createRequire } from 'node:module';

await import('@golemui/gui-components');
await import('@golemui/gui-components/textinput');

if (!customElements.get('gui-textinput')) {
  throw new Error('gui-textinput was not registered');
}
createRequire(import.meta.url).resolve('@golemui/gui-components/index.css');
`;

function main() {
  if (!process.argv.includes('--skip-build')) {
    run('npx nx run-many -t build -p gui-components lit-utils', repoRoot);
  }

  const scratch = mkdtempSync(join(tmpdir(), 'gui-components-isolation-'));
  try {
    const tarballs = distDirs.map(
      (distDir) =>
        run(`npm pack "${distDir}" --pack-destination "${scratch}"`, repoRoot)
          .trim()
          .split('\n')
          .pop() as string,
    );

    writeFileSync(
      join(scratch, 'package.json'),
      JSON.stringify({ name: 'gui-components-isolation', private: true, type: 'module' }),
    );
    const tarballArgs = tarballs.map((tarball) => `"./${tarball}"`).join(' ');
    run(`npm install --no-audit --no-fund ${tarballArgs} lit@^3`, scratch);

    const golemuiPackages = readdirSync(join(scratch, 'node_modules/@golemui')).sort();
    if (golemuiPackages.join() !== packages.join()) {
      throw new Error(
        `Installing gui-components pulled in other @golemui packages: ${golemuiPackages.join(', ')}`,
      );
    }

    writeFileSync(join(scratch, 'check.mjs'), importCheck);
    run('node check.mjs', scratch);

    console.log('[components-isolation] gui-components installs and loads with lit and lit-utils');
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

main();
