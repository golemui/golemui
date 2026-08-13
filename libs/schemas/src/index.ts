import commonSchemaJson from './lib/core/common.schema.json';

// Annotated instead of re-exported straight from the JSON module, so the emitted
// index.d.ts contains no `.json` import. A consumer then needs neither
// `resolveJsonModule` nor a `type: "json"` import attribute to use this package.
/** The shared core `$defs` resource, published as `schemas/core/common.schema.json`. */
export const commonSchema: Record<string, unknown> = commonSchemaJson;

export type {
  ImplementationSchemaConfig,
  WidgetKind,
  WidgetManifestEntry,
} from './lib/manifest.types.js';
export {
  buildFormEnvelope,
  buildLayoutWidgetSchema,
  buildSchemasPackageIndex,
  buildWidgetsSchema,
} from './lib/generator/builders.js';
export type { SchemaObject } from './lib/generator/builders.js';
export {
  buildEditorBundle,
  EDITOR_BUNDLE_ENTRY_FILE,
  EDITOR_BUNDLE_FILE,
} from './lib/generator/editor-bundle.js';
