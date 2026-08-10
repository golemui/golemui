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
 *   generatorPath: 'libs/gui/schemas/tools/generate-schemas.ts',
 *   formTitle: 'Golem Form DSL',
 *   statesDescription: 'Named boolean conditions keyed by state name, ...',
 *   manifest: guiWidgetManifest,
 *   libRootSchemaFiles: ['ranges.schema.json', 'validators.schema.json'],
 *   includeSchemalessTypesInKnownWidgetTypes: true,
 *   includeCustomWidgetFallback: true,
 * };
 */
export interface ImplementationSchemaConfig {
  /** Implementation name, e.g. `gui`. Used in generated titles. */
  readonly implementation: string;
  /** Absolute base URL of the implementation's published schema tree, with a trailing slash. */
  readonly idBase: string;
  /** Repo-relative path of the implementation's generator entry point, used in the generated-file markers. */
  readonly generatorPath: string;
  /** `title` of the generated form envelope. */
  readonly formTitle: string;
  /** Description of the form envelope's `states` property, naming the implementation's suffixable root props. */
  readonly statesDescription: string;
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
  /**
   * When true, the `formWidget` union includes `components/custom.schema.json`
   * and the generated index exports it as `customSchema`. Turn off for an
   * implementation without a custom-widget fallback.
   */
  readonly includeCustomWidgetFallback: boolean;
}
