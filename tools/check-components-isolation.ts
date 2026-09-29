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
 * point and resolves the stylesheets. An import of any other @golemui package fails there, because
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
const require = createRequire(import.meta.url);
for (const stylesheet of ['index.css', 'tokens.css', 'components.css', 'themes/clay.css']) {
  require.resolve(\`@golemui/gui-components/\${stylesheet}\`);
}

// The Custom Elements Manifest that the package.json \`customElements\` field points to.
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const packageDir = join('node_modules', '@golemui', 'gui-components');
const { customElements: manifestPath } = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(packageDir, manifestPath), 'utf8'));
const tags = manifest.modules.flatMap((module) => module.declarations ?? []).map((d) => d.tagName);
if (!tags.includes('gui-textinput')) {
  throw new Error('custom-elements.json does not describe gui-textinput');
}
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
