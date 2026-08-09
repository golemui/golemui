/**
 * The widget categories shared by every implementation. Matches the `kind`
 * field of the widgets an implementation produces at runtime.
 */
export type WidgetKind = 'input' | 'layout' | 'display' | 'action';

/**
 * One widget type of an implementation, as declared in its widget manifest.
 * The manifest is the single source of truth from which the implementation's
 * aggregate schema files are generated.
 *
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
   * File name of the component schema inside the implementation's `components/`
   * directory. Absent for widget types that cannot be expressed in JSON (for
   * example a widget whose props contain a function).
   */
  readonly schemaFile?: string;
  /** The widget category. Entries with kind `layout` form the layout-widget union. */
  readonly kind: WidgetKind;
}

/**
 * Everything the schema builders need to generate one implementation's
 * aggregate schema files.
 *
 * @example
 * const config: ImplementationSchemaConfig = {
 *   implementation: 'gui',
 *   idBase: 'https://golemui.com/schemas/gui/',
 *   manifest: guiWidgetManifest,
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
   * When true, widget types without a `schemaFile` are still listed in the
   * generated `knownWidgetTypes` enum. Their `type` then fails validation
   * entirely instead of matching the custom-widget fallback.
   */
  readonly includeSchemalessTypesInKnownWidgetTypes: boolean;
}
