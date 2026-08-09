/**
 * Generates the gui schema tree from the widget manifest using the
 * @golemui/schemas builders. Emits, all committed and staleness-checked in CI:
 * - src/lib/widgets.schema.json         formWidget union + knownWidgetTypes enum
 * - src/lib/form.schema.json            form envelope
 * - src/lib/layout-widget.schema.json   layout widget union
 * - src/lib/core/*.schema.json          vendored @golemui/schemas core copies
 * - src/index.ts                        package entry point + COMPONENT_SCHEMAS_BY_TYPE
 * Outputs are prettier-formatted. Run with `npm run generate:schemas`.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { format, resolveConfig } from 'prettier';
import {
  buildFormEnvelope,
  buildLayoutWidgetSchema,
  buildSchemasPackageIndex,
  buildWidgetsSchema,
} from '@golemui/schemas';
import { guiSchemaConfig } from '../src/lib/widget-manifest';

// cwd is the repo root for npm scripts (import.meta is unavailable under module commonjs).
const REPO_ROOT = process.cwd();
const PACKAGE_ROOT = join(REPO_ROOT, 'libs', 'gui', 'schemas');
const LIB_DIR = join(PACKAGE_ROOT, 'src', 'lib');
const CORE_SOURCE_DIR = join(REPO_ROOT, 'libs', 'schemas', 'src', 'lib', 'core');

function coreSchemaFileNames(directory: string): string[] {
  return readdirSync(directory)
    .filter((file) => file.endsWith('.schema.json'))
    .sort();
}

async function formatWithRepoConfig(content: string, filePath: string): Promise<string> {
  const options = (await resolveConfig(filePath)) ?? {};
  return format(content, { ...options, filepath: filePath });
}

async function main(): Promise<void> {
  const outputs: Array<{ path: string; content: string }> = [];

  async function addJsonOutput(path: string, schema: unknown): Promise<void> {
    outputs.push({ path, content: await formatWithRepoConfig(JSON.stringify(schema), path) });
  }

  await addJsonOutput(join(LIB_DIR, 'widgets.schema.json'), buildWidgetsSchema(guiSchemaConfig));
  await addJsonOutput(join(LIB_DIR, 'form.schema.json'), buildFormEnvelope(guiSchemaConfig));
  await addJsonOutput(
    join(LIB_DIR, 'layout-widget.schema.json'),
    buildLayoutWidgetSchema(guiSchemaConfig),
  );
  // Copy core files verbatim so the drift test can require byte identity. Listing
  // the source directory means a newly added core file cannot be skipped.
  const coreFiles = coreSchemaFileNames(CORE_SOURCE_DIR);
  for (const coreFile of coreFiles) {
    outputs.push({
      path: join(LIB_DIR, 'core', coreFile),
      content: readFileSync(join(CORE_SOURCE_DIR, coreFile), 'utf-8'),
    });
  }
  const indexPath = join(PACKAGE_ROOT, 'src', 'index.ts');
  outputs.push({
    path: indexPath,
    content: await formatWithRepoConfig(buildSchemasPackageIndex(guiSchemaConfig), indexPath),
  });

  mkdirSync(join(LIB_DIR, 'core'), { recursive: true });
  for (const output of outputs) {
    writeFileSync(output.path, output.content, 'utf-8');
    console.log(`Wrote ${relative(REPO_ROOT, output.path)} (${output.content.length} bytes)`);
  }

  // Removed core sources are not auto-deleted here. Fail so a stale vendored copy cannot ship.
  const orphanedVendoredFiles = coreSchemaFileNames(join(LIB_DIR, 'core')).filter(
    (file) => !coreFiles.includes(file),
  );
  if (orphanedVendoredFiles.length > 0) {
    throw new Error(
      `Vendored core files without a @golemui/schemas source: ${orphanedVendoredFiles.join(', ')}. ` +
        `Delete them from ${relative(REPO_ROOT, join(LIB_DIR, 'core'))}.`,
    );
  }

  console.log(
    `Generated ${outputs.length} files from ${guiSchemaConfig.manifest.length} manifest entries.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
