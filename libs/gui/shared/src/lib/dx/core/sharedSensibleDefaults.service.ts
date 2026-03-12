// ═══════════════════════════════════════════════════
// Shared Sensible Defaults — reusable processors for input-like types
// ═══════════════════════════════════════════════════

/**
 * Config interface for types that support automatic labels.
 */
export interface LabelSensibleDefaultsConfig {
  suppressAutomaticLabels?: boolean;
}

/**
 * Config interface for types that support automatic placeholders.
 */
export interface PlaceholderSensibleDefaultsConfig {
  suppressAutomaticPlaceholders?: boolean;
}

export function pathToLabel(path: string | undefined): string {
  if (!path) return '';
  return path
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Auto-generate a label from the field path if none is explicitly set.
 * Reusable across inputs, calendar, and future input-like types.
 *
 * Behavior must match existing `inputSensibleDefaults.service.ts` and
 * `calendarSensibleDefaults.service.ts` exactly.
 */
export function processAutoLabel<D extends { path?: string; label?: string | null }>(
  def: D,
  config: LabelSensibleDefaultsConfig,
): D {
  if (def.label != null) return def;
  if (config.suppressAutomaticLabels) return def;
  if (!def.path) return def;
  return { ...def, label: pathToLabel(def.path) };
}

/**
 * Auto-generate a placeholder from the field path if none is explicitly set.
 * Reusable across inputs, textarea, password, and future input-like types.
 *
 * Behavior must match existing `inputSensibleDefaults.service.ts` exactly.
 */
export function processAutoPlaceholder<D extends { path?: string; placeholder?: string }>(
  def: D,
  config: PlaceholderSensibleDefaultsConfig,
): D {
  if (def.placeholder != null) return def;
  if (config.suppressAutomaticPlaceholders) return def;
  if (!def.path) return def;
  return { ...def, placeholder: def.path };
}
