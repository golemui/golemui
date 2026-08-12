/**
 * Shared generator for an implementation's schema tree, called by each
 * implementation's generator entry point. Emits into the implementation package:
 * - src/lib/widgets.schema.json         formWidget union + knownWidgetTypes enum
 * - src/lib/form.schema.json            form envelope
 * - src/lib/layout-widget.schema.json   layout widget union
 * - src/lib/form.editor.schema.json     self-contained editor bundle (opt-in)
 * - src/lib/core/*.schema.json          vendored @golemui/schemas core copies
 * - src/index.ts                        package entry point + COMPONENT_SCHEMAS_BY_TYPE
 *
 * Outputs are prettier-formatted when prettier and a config are available, which is
 * the case inside this repository. Elsewhere they are written as-is, already indented.
 *
 * The core source directory is derived from this module's own path, never from cwd,
 * so a wrong working directory cannot write a schema tree somewhere else.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildFormEnvelope,
  buildLayoutWidgetSchema,
  buildSchemasPackageIndex,
  buildWidgetsSchema,
  type SchemaObject,
} from './builders.js';
import { buildEditorBundle, EDITOR_BUNDLE_FILE } from './editor-bundle.js';
import type { ImplementationSchemaConfig } from '../manifest.types.js';

interface PrettierModule {
  resolveConfig: (filePath: string) => Promise<Record<string, unknown> | null>;
  format: (source: string, options: Record<string, unknown>) => Promise<string>;
}

/**
 * Prettier is an optional peer dependency: this repository formats generated output
 * with it, an installed implementation package usually has no prettier at all.
 */
async function loadPrettier(): Promise<PrettierModule | null> {
  try {
    return (await import('prettier')) as unknown as PrettierModule;
  } catch {
    return null;
  }
}

/**
 * Resolves the prettier config nearest to a path, or null when prettier is absent or
 * finds no config. Formatting with prettier defaults instead would silently reformat
 * every generated file of a project that has its own style.
 */
async function resolveFormatter(
  filePath: string,
): Promise<{ prettier: PrettierModule; options: Record<string, unknown> } | null> {
  const prettier = await loadPrettier();
  if (prettier === null) {
    return null;
  }
  const options = await prettier.resolveConfig(filePath);
  return options === null ? null : { prettier, options };
}

/**
 * Serializes a schema. Prettier is fed compact JSON on purpose: it keeps whatever
 * object layout it is given, so compact input lets it collapse short objects onto one
 * line. Without prettier the output is plainly indented instead.
 */
async function formatJsonOutput(schema: SchemaObject, filePath: string): Promise<string> {
  const formatter = await resolveFormatter(filePath);
  if (formatter === null) {
    return JSON.stringify(schema, null, 2) + '\n';
  }
  return formatter.prettier.format(JSON.stringify(schema), {
    ...formatter.options,
    filepath: filePath,
  });
}

/** Formats already-written text (vendored JSON, generated TypeScript), unchanged without prettier. */
async function formatTextOutput(content: string, filePath: string): Promise<string> {
  const formatter = await resolveFormatter(filePath);
  if (formatter === null) {
    return content;
  }
  return formatter.prettier.format(content, { ...formatter.options, filepath: filePath });
}

function coreSchemaFileNames(directory: string): string[] {
  return readdirSync(directory)
    .filter((file) => file.endsWith('.schema.json'))
    .sort();
}

/** Walks up from a directory to the nearest one holding a package.json. */
function findPackageRoot(startDir: string): string {
  let directory = startDir;
  for (;;) {
    if (existsSync(join(directory, 'package.json'))) {
      return directory;
    }
    const parent = dirname(directory);
    if (parent === directory) {
      throw new Error(`No package.json above ${startDir}, cannot locate @golemui/schemas.`);
    }
    directory = parent;
  }
}

/**
 * Locates this package's own core schemas: under `src/lib/core/` in the source tree and
 * under `schemas/core/` once built. Both are resolved from the package root rather than
 * from this module, whose depth differs between the two layouts, and a candidate counts
 * only if it actually holds schema files.
 */
function resolveCoreSourceDir(): string {
  const packageRoot = findPackageRoot(dirname(fileURLToPath(import.meta.url)));
  const candidates = [
    join(packageRoot, 'src', 'lib', 'core'),
    join(packageRoot, 'schemas', 'core'),
  ];
  const found = candidates.find(
    (candidate) => existsSync(candidate) && coreSchemaFileNames(candidate).length > 0,
  );
  if (found === undefined) {
    throw new Error(
      `Cannot find the @golemui/schemas core schemas. Looked in: ${candidates.join(', ')}.`,
    );
  }
  return found;
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
 * // The implementation package's generator entry point:
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
  const coreSourceDir = resolveCoreSourceDir();

  const outputs: Array<{ path: string; content: string }> = [];
  // Keyed by lib-relative path so the editor bundle reads what this run is about to
  // write, not the previous run's files still on disk.
  const pendingSchemasByLibPath = new Map<string, SchemaObject>();

  async function addJsonOutput(libRelativePath: string, schema: SchemaObject): Promise<void> {
    const path = join(libDir, libRelativePath);
    pendingSchemasByLibPath.set(libRelativePath, schema);
    outputs.push({ path, content: await formatJsonOutput(schema, path) });
  }

  await addJsonOutput('widgets.schema.json', buildWidgetsSchema(config));
  await addJsonOutput('form.schema.json', buildFormEnvelope(config));
  await addJsonOutput('layout-widget.schema.json', buildLayoutWidgetSchema(config));

  // Vendor the core files under the implementation tree. The `$id` is rebased onto that
  // tree so it matches the retrieval URI sibling refs like `../core/common.schema.json`
  // resolve to, which is what lets the published JSON tree be loaded by `$id` alone.
  // Everything else is copied verbatim, then formatted like every other output.
  // Listing the source directory means a newly added core file cannot be skipped.
  const coreFiles = coreSchemaFileNames(coreSourceDir);
  for (const coreFile of coreFiles) {
    const libRelativePath = `core/${coreFile}`;
    const outputPath = join(libDir, libRelativePath);
    const rebasedText = withRebasedId(
      readFileSync(join(coreSourceDir, coreFile), 'utf-8'),
      `${config.idBase}core/${coreFile}`,
      coreFile,
    );
    pendingSchemasByLibPath.set(libRelativePath, JSON.parse(rebasedText) as SchemaObject);
    outputs.push({ path: outputPath, content: await formatTextOutput(rebasedText, outputPath) });
  }

  if (config.emitEditorBundle === true) {
    const bundlePath = join(libDir, EDITOR_BUNDLE_FILE);
    const bundle = buildEditorBundle(config, (libRelativePath) =>
      readSchemaForBundle(libDir, libRelativePath, pendingSchemasByLibPath),
    );
    outputs.push({ path: bundlePath, content: await formatJsonOutput(bundle, bundlePath) });
  }

  const indexPath = join(packageRoot, 'src', 'index.ts');
  outputs.push({
    path: indexPath,
    content: await formatTextOutput(buildSchemasPackageIndex(config), indexPath),
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

/** Reads a schema for the editor bundle, preferring this run's output over what is on disk. */
function readSchemaForBundle(
  libDir: string,
  libRelativePath: string,
  pendingSchemasByLibPath: Map<string, SchemaObject>,
): SchemaObject {
  const pending = pendingSchemasByLibPath.get(libRelativePath);
  if (pending !== undefined) {
    return pending;
  }
  const path = join(libDir, libRelativePath);
  if (!existsSync(path)) {
    throw new Error(
      `Cannot build the editor bundle: ${libRelativePath} is referenced by the schema tree but does not exist. ` +
        `Expected it at ${path}.`,
    );
  }
  return JSON.parse(readFileSync(path, 'utf-8')) as SchemaObject;
}
