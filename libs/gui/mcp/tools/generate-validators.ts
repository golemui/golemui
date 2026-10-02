/**
 * Generates the validators module that the `json` entry imports, from the schemas of
 * `@golemui/gui-schemas`. Run with `npm run generate:validators`. The nx target
 * `generate-validators` runs it before `build` and `vite:test` of gui-mcp.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildValidatorsModule } from './build-validators-module';

const here = dirname(fileURLToPath(import.meta.url));
const outputDirectory = process.argv[2] ?? join(here, '..', 'src', 'json', 'schemas', 'generated');

const javascript = buildValidatorsModule();
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(join(outputDirectory, 'validators.js'), javascript);
console.log(`Wrote validators.js (${javascript.length} bytes) to ${outputDirectory}`);
