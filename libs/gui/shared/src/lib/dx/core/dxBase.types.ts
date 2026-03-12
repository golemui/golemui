// ═══════════════════════════════════════════════════
// DX Base Types — public and internal decorator bases
// ═══════════════════════════════════════════════════

/**
 * INTERNAL decorator fields — used by the pipeline, NOT by form authors.
 * Contains fields that the pipeline needs but users should never set.
 */
export interface DxInternalFields {
  itemType?: string;
  removeField?: boolean;
}

/**
 * User-settable common fields available on ALL decorator types.
 */
export interface DxCommonFields {
  uid?: string;
  tags?: string[];
}

/**
 * PUBLIC base for input-like decorators.
 * Clean projection of InputWidget properties — no generics, no SomeSuffixable.
 */
export interface DxInputBase {
  path?: string;
  label?: string | null;
  disabled?: boolean;
  readonly?: boolean;
  defaultValue?: unknown;
}

/**
 * PUBLIC base for action decorators.
 */
export interface DxActionBase {
  label?: string;
  disabled?: boolean;
}

/**
 * PUBLIC base for layout decorators.
 * Currently empty — layouts only have children (structural) and props (type-specific).
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
export interface DxLayoutBase {
  // intentionally empty
}

/**
 * PUBLIC base for display decorators.
 * Displays are render-function-only — no shared properties beyond uid.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
export interface DxDisplayBase {
  // intentionally empty
}
