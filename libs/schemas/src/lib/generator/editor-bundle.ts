/**
 * Bundles an implementation's schema tree into one self-contained schema for editors.
 *
 * The per-file schemas declare absolute `$id`s, so an editor resolves their relative
 * `$ref`s against those URLs and tries to download them, which fails offline, in
 * untrusted workspaces, and wherever the `idBase` is not hosted. Ajv does not have the
 * problem because every file is registered up front. The bundle inlines each reachable
 * file under `$defs`, drops the `$id`s, and rewrites every `$ref` to a same-document
 * pointer.
 */
import type { ImplementationSchemaConfig } from '../manifest.types.js';
import { generatedFileOrigin, type SchemaObject } from './builders.js';

const JSON_SCHEMA_DIALECT = 'https://json-schema.org/draft/2020-12/schema';

/** The file the walk starts from, relative to the implementation's `src/lib`. */
export const EDITOR_BUNDLE_ENTRY_FILE = 'form.schema.json';

/** Output file name, relative to the implementation's `src/lib`. */
export const EDITOR_BUNDLE_FILE = 'form.editor.schema.json';

/**
 * Keywords whose value is a map from arbitrary names to schemas. A key inside one of
 * these is a property name, so a property named `$ref` must not be read as a reference.
 */
const SCHEMA_MAP_KEYWORDS = new Set([
  '$defs',
  'definitions',
  'properties',
  'patternProperties',
  'dependentSchemas',
]);

/** Maps a lib-relative schema path to its `$defs` key in the bundle. */
function slugForFile(libRelativePath: string): string {
  const baseName = libRelativePath.split('/').pop() as string;
  return baseName.replace(/\.schema\.json$/, '');
}

/** Resolves a relative path against a lib-relative directory, without touching the file system. */
function resolveRelativePath(fromLibRelativePath: string, target: string): string {
  const segments = fromLibRelativePath.split('/').slice(0, -1);
  for (const segment of target.split('/')) {
    if (segment === '.' || segment === '') {
      continue;
    }
    if (segment === '..') {
      segments.pop();
    } else {
      segments.push(segment);
    }
  }
  return segments.join('/');
}

/**
 * Rewrites one `$ref` to a same-document pointer and records the file it points at.
 * @param ref - The original `$ref` value.
 * @param libRelativePath - Lib-relative path of the file holding the ref.
 * @param discovered - Collects lib-relative paths found while walking.
 */
function rewriteRef(ref: string, libRelativePath: string, discovered: string[]): string {
  if (ref.startsWith('#')) {
    return `#/$defs/${slugForFile(libRelativePath)}${ref.slice(1)}`;
  }
  const hashIndex = ref.indexOf('#');
  const filePart = hashIndex === -1 ? ref : ref.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? '' : ref.slice(hashIndex + 1);
  const targetPath = resolveRelativePath(libRelativePath, filePart);
  discovered.push(targetPath);
  return `#/$defs/${slugForFile(targetPath)}${fragment}`;
}

/** Deep-copies a schema node, rewriting every `$ref` keyword along the way. */
function transformSchema(node: unknown, libRelativePath: string, discovered: string[]): unknown {
  if (Array.isArray(node)) {
    return node.map((item) => transformSchema(item, libRelativePath, discovered));
  }
  if (node === null || typeof node !== 'object') {
    return node;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === '$ref' && typeof value === 'string') {
      result[key] = rewriteRef(value, libRelativePath, discovered);
    } else if (SCHEMA_MAP_KEYWORDS.has(key) && value !== null && typeof value === 'object') {
      result[key] = transformSchemaMap(
        value as Record<string, unknown>,
        libRelativePath,
        discovered,
      );
    } else {
      result[key] = transformSchema(value, libRelativePath, discovered);
    }
  }
  return result;
}

/** Deep-copies a map of name to schema, where the keys are names rather than keywords. */
function transformSchemaMap(
  node: Record<string, unknown>,
  libRelativePath: string,
  discovered: string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [name, schema] of Object.entries(node)) {
    result[name] = transformSchema(schema, libRelativePath, discovered);
  }
  return result;
}

/**
 * Builds the self-contained editor schema by walking the `$ref` graph from the form
 * envelope. Every reachable file is inlined, so the result loads with no network access.
 * @param config - The implementation's schema configuration.
 * @param readSchema - Returns the parsed schema at a lib-relative path, e.g. `components/flex.schema.json`.
 * @returns The bundle, ready to be serialized.
 * @example
 * const bundle = buildEditorBundle(config, (path) =>
 *   JSON.parse(readFileSync(join(libDir, path), 'utf-8')),
 * );
 */
export function buildEditorBundle(
  config: ImplementationSchemaConfig,
  readSchema: (libRelativePath: string) => SchemaObject,
): SchemaObject {
  const { manifestPath, regenerateCommand } = generatedFileOrigin(config);
  const transformedBySlug: Record<string, unknown> = {};
  const fileBySlug = new Map<string, string>();
  const queue = [EDITOR_BUNDLE_ENTRY_FILE];

  while (queue.length > 0) {
    const libRelativePath = queue.shift() as string;
    const slug = slugForFile(libRelativePath);
    const alreadyBundled = fileBySlug.get(slug);
    if (alreadyBundled === libRelativePath) {
      continue;
    }
    // Two files sharing a base name would overwrite each other's $defs entry.
    if (alreadyBundled !== undefined) {
      throw new Error(
        `Cannot bundle: "${alreadyBundled}" and "${libRelativePath}" both use the $defs key "${slug}". ` +
          'Rename one of them.',
      );
    }
    fileBySlug.set(slug, libRelativePath);
    const schema = { ...readSchema(libRelativePath) };
    delete schema['$schema'];
    delete schema['$id'];
    delete schema['$comment'];
    transformedBySlug[slug] = transformSchema(schema, libRelativePath, queue);
  }

  const entrySlug = slugForFile(EDITOR_BUNDLE_ENTRY_FILE);
  const entry = transformedBySlug[entrySlug] as SchemaObject;
  return {
    $schema: JSON_SCHEMA_DIALECT,
    $comment:
      `GENERATED by ${config.generatorPath} from ${manifestPath}. ` +
      `DO NOT EDIT. Regenerate with \`${regenerateCommand}\`. ` +
      'Self-contained copy of the schema tree for editors, which cannot resolve the published $ids offline.',
    title: `${entry['title'] as string} (editor bundle)`,
    $ref: `#/$defs/${entrySlug}`,
    $defs: transformedBySlug,
  };
}
