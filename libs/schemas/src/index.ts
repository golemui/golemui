export { default as commonSchema } from './lib/core/common.schema.json';
export { default as legacyFormAliasSchema } from './lib/form.schema.json';
export type {
  ImplementationSchemaConfig,
  WidgetKind,
  WidgetManifestEntry,
} from './lib/manifest.types';
export {
  buildFormEnvelope,
  buildLayoutWidgetSchema,
  buildSchemasPackageIndex,
  buildWidgetsSchema,
} from './lib/generator/builders';
export type { SchemaObject } from './lib/generator/builders';
