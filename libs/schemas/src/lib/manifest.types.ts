/** The widget categories shared by every implementation, matching the runtime widget `kind` field. */
export type WidgetKind = 'input' | 'layout' | 'display' | 'action';

/**
 * One widget type in an implementation's manifest, the single source of truth
 * for the generated aggregate schema files.
 * @example
 * const entry: WidgetManifestEntry = {
 *   type: 'dateTimeCalendar',
 *   schemaFile: 'datetimecalendar.schema.json',
 *   kind: 'input',
 * };
 */
export interface WidgetManifestEntry {
  /** The widget `type` const used in JSON form definitions, e.g. `dateTimeCalendar`. */
  readonly type: string;
  /**
   * Component schema file name inside the implementation's `components/` directory.
   * Absent for widget types that JSON cannot express (e.g. props holding a function).
   */
  readonly schemaFile?: string;
  /** The widget category. Entries with kind `layout` form the layout-widget union. */
  readonly kind: WidgetKind;
}

/**
 * Everything the schema builders need to generate one implementation's
 * aggregate schema files.
 * @example
 * const config: ImplementationSchemaConfig = {
 *   implementation: 'gui',
 *   idBase: 'https://golemui.com/schemas/gui/',
 *   manifest: guiWidgetManifest,
 *   libRootSchemaFiles: ['ranges.schema.json', 'validators.schema.json'],
 *   includeSchemalessTypesInKnownWidgetTypes: true,
 * };
 */
export interface ImplementationSchemaConfig {
  /** Implementation name, e.g. `gui`. Used in generated titles and file markers. */
  readonly implementation: string;
  /** Absolute base URL of the implementation's published schema tree, with a trailing slash. */
  readonly idBase: string;
  /** The implementation's widget manifest. */
  readonly manifest: readonly WidgetManifestEntry[];
  /**
   * Handwritten schema files at the implementation package's `src/lib/` root,
   * e.g. `validators.schema.json`. Each is re-exported from the generated index
   * under its derived name (`validators.schema.json` exports `validatorsSchema`).
   */
  readonly libRootSchemaFiles: readonly string[];
  /**
   * When true, schema-less widget types are still listed in `knownWidgetTypes`,
   * so their `type` fails validation instead of matching the custom fallback.
   */
  readonly includeSchemalessTypesInKnownWidgetTypes: boolean;
}
