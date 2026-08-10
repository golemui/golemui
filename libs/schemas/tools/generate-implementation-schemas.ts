/**
 * Shared generator for an implementation's schema tree, called by each
 * implementation's `tools/generate-schemas.ts` entry point. Emits into the
 * implementation package, all committed and staleness-checked in CI:
 * - src/lib/widgets.schema.json         formWidget union + knownWidgetTypes enum
 * - src/lib/form.schema.json            form envelope
 * - src/lib/layout-widget.schema.json   layout widget union
 * - src/lib/core/*.schema.json          vendored @golemui/schemas core copies
 * - src/index.ts                        package entry point + COMPONENT_SCHEMAS_BY_TYPE
 * Outputs are prettier-formatted. Dev-only, never published: this file lives in
 * `tools/`, outside the package's `src/` build input.
 *
 * The core source directory is derived from this module's own path, never from
 * cwd, so a wrong working directory cannot write a schema tree somewhere else.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import {
  buildFormEnvelope,
  buildLayoutWidgetSchema,
  buildSchemasPackageIndex,
  buildWidgetsSchema,
} from '../src/lib/generator/builders.js';
import type { ImplementationSchemaConfig } from '../src/lib/manifest.types.js';

function coreSchemaFileNames(directory: string): string[] {
  return readdirSync(directory)
    .filter((file) => file.endsWith('.schema.json'))
    .sort();
}

async function formatWithRepoConfig(content: string, filePath: string): Promise<string> {
  const options = await resolveConfig(filePath);
  if (options === null) {
    throw new Error(
      `No prettier config found searching upward from ${filePath}. ` +
        'The output path must be inside the repository, formatting with prettier defaults would silently reformat every generated file.',
    );
  }
  return format(content, { ...options, filepath: filePath });
}

/** Replaces the single `$id` value in a schema file's raw text, leaving the rest untouched. */
function withRebasedId(schemaText: string, id: string, fileName: string): string {
  const idPattern = /"\$id":\s*"[^"]*"/g;
  const matches = schemaText.match(idPattern);
  if (matches?.length !== 1) {
    throw new Error(`Expected exactly one $id in ${fileName}, found ${matches?.length ?? 0}.`);
  }
  return schemaText.replace(idPattern, () => `"$id": "${id}"`);
}

/**
 * Generates one implementation's schema tree into its package directory.
 * @param config - The implementation's schema configuration.
 * @param packageRoot - Absolute path of the implementation package, the directory holding its `src/`.
 * @returns Resolves when every output file is written. Callers own error handling.
 * @example
 * // tools/generate-schemas.ts of an implementation package:
 * generateImplementationSchemas(kendoSchemaConfig, join(__dirname, '..')).catch((error) => {
 *   console.error(error);
 *   process.exitCode = 1;
 * });
 */
export async function generateImplementationSchemas(
  config: ImplementationSchemaConfig,
  packageRoot: string,
): Promise<void> {
  const libDir = join(packageRoot, 'src', 'lib');
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const coreSourceDir = join(moduleDir, '..', 'src', 'lib', 'core');

  const outputs: Array<{ path: string; content: string }> = [];

  async function addJsonOutput(path: string, schema: unknown): Promise<void> {
    outputs.push({ path, content: await formatWithRepoConfig(JSON.stringify(schema), path) });
  }

  await addJsonOutput(join(libDir, 'widgets.schema.json'), buildWidgetsSchema(config));
  await addJsonOutput(join(libDir, 'form.schema.json'), buildFormEnvelope(config));
  await addJsonOutput(join(libDir, 'layout-widget.schema.json'), buildLayoutWidgetSchema(config));
  // Vendor the core files under the implementation tree. The `$id` is rebased onto that
  // tree so it matches the retrieval URI sibling refs like `../core/common.schema.json`
  // resolve to, which is what lets the published JSON tree be loaded by `$id` alone.
  // Everything else is copied verbatim, then prettier-formatted like every other output.
  // Listing the source directory means a newly added core file cannot be skipped.
  const coreFiles = coreSchemaFileNames(coreSourceDir);
  for (const coreFile of coreFiles) {
    const outputPath = join(libDir, 'core', coreFile);
    outputs.push({
      path: outputPath,
      content: await formatWithRepoConfig(
        withRebasedId(
          readFileSync(join(coreSourceDir, coreFile), 'utf-8'),
          `${config.idBase}core/${coreFile}`,
          coreFile,
        ),
        outputPath,
      ),
    });
  }
  const indexPath = join(packageRoot, 'src', 'index.ts');
  outputs.push({
    path: indexPath,
    content: await formatWithRepoConfig(buildSchemasPackageIndex(config), indexPath),
  });

  mkdirSync(join(libDir, 'core'), { recursive: true });

  // Removed core sources are not auto-deleted here. Fail so a stale vendored copy cannot
  // ship, and fail before the write loop so a failing run does not mutate the tree.
  const orphanedVendoredFiles = coreSchemaFileNames(join(libDir, 'core')).filter(
    (file) => !coreFiles.includes(file),
  );
  if (orphanedVendoredFiles.length > 0) {
    throw new Error(
      `Vendored core files without a @golemui/schemas source: ${orphanedVendoredFiles.join(', ')}. ` +
        `Delete them from ${relative(packageRoot, join(libDir, 'core'))}.`,
    );
  }

  for (const output of outputs) {
    writeFileSync(output.path, output.content, 'utf-8');
    console.log(`Wrote ${relative(packageRoot, output.path)} (${output.content.length} bytes)`);
  }

  console.log(`Generated ${outputs.length} files from ${config.manifest.length} manifest entries.`);
}
