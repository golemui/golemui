/**
 * Generates the gui schema tree from the widget manifest
 * (src/lib/widget-manifest.ts) using the builders exported by @golemui/schemas.
 *
 * Emits, all committed and checked for staleness in CI:
 * - src/lib/widgets.schema.json         the formWidget union + knownWidgetTypes enum
 * - src/lib/form.schema.json            the form envelope
 * - src/lib/layout-widget.schema.json   the layout widget union
 * - src/lib/core/*.schema.json          vendored copies of the @golemui/schemas core files
 * - src/index.ts                        the package entry point + COMPONENT_SCHEMAS_BY_TYPE
 *
 * Every output is formatted through the prettier API so `nx format:write`
 * never changes generated files. Run with `npm run generate:schemas`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { format, resolveConfig } from 'prettier';
import {
  buildFormEnvelope,
  buildLayoutWidgetSchema,
  buildSchemasPackageIndex,
  buildWidgetsSchema,
} from '@golemui/schemas';
import { guiSchemaConfig } from '../src/lib/widget-manifest';

// npm scripts always run at the repo root. import.meta is not available here
// because this project's tsconfig compiles with module commonjs.
const REPO_ROOT = process.cwd();
const PACKAGE_ROOT = join(REPO_ROOT, 'libs', 'gui', 'schemas');
const LIB_DIR = join(PACKAGE_ROOT, 'src', 'lib');
const CORE_SOURCE_DIR = join(REPO_ROOT, 'libs', 'schemas', 'src', 'lib', 'core');
const CORE_FILES = ['common.schema.json', 'validators.schema.json'];

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
  // Vendored copies are verbatim byte copies of the @golemui/schemas sources,
  // never re-serialized, so the drift test can require byte identity.
  for (const coreFile of CORE_FILES) {
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
  console.log(
    `Generated ${outputs.length} files from ${guiSchemaConfig.manifest.length} manifest entries.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
