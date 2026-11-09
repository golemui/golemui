/**
 * Generates the validator modules that the `json` and `json-lazy` entries import, from the
 * schemas of `@golemui/gui-schemas`. Run with `npm run generate:validators`. The nx target
 * `generate-validators` runs it before `build` and `vite:test` of gui-mcp.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildValidatorModules } from './build-validator-modules';

const here = dirname(fileURLToPath(import.meta.url));
const outputDirectory = process.argv[2] ?? join(here, '..', 'src', 'json', 'schemas', 'generated');

const modules = buildValidatorModules();

// Remove the modules of a previous run, so a validator that no longer exists does not linger.
// The hand-written `.d.ts` files stay.
mkdirSync(outputDirectory, { recursive: true });
for (const entry of readdirSync(outputDirectory, { recursive: true, withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.js')) {
    rmSync(join(entry.parentPath, entry.name));
  }
}

let totalBytes = 0;
for (const [modulePath, javascript] of modules) {
  const file = join(outputDirectory, `${modulePath}.js`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, javascript);
  totalBytes += javascript.length;
}
console.log(`Wrote ${modules.size} modules (${totalBytes} bytes) to ${outputDirectory}`);
