// ═══════════════════════════════════════════════════
// DX Base Types — public and internal decorator bases
// ═══════════════════════════════════════════════════

import type { FormEvent } from '@golemui/core';

/**
 * DX-enriched FormEvent. Extends the core FormEvent with `update()` — the
 * recommended way for DX event handlers to push widget property changes.
 *
 * `update({ path: 'widget', options: [...] })` translates to OVERRIDE_WIDGET_PROP
 * dispatches under the hood. `callback` is also available for raw/backward-compat use.
 */
export type DxFormEvent = FormEvent & {
  update: (arg: { path: string; [prop: string]: any }) => void;
};

/**
 * Event handler type for DX event properties.
 * - Function: handler invoked with a DxFormEvent (use event.update to push widget changes).
 * - String: pass-through event name for host-managed dispatch.
 */
export type DxEventHandler = string | ((event: DxFormEvent) => void);

/**
 * INTERNAL decorator fields — used by the pipeline, NOT by form authors.
 * Contains fields that the pipeline needs but users should never set.
 */
export interface DxInternalFields {
  itemType?: string;
  removeField?: boolean;
}

/**
 * A `when` condition tuple: `[expression, overrideObject]`.
 * Single or array form accepted on decorators.
 */
export type DxWhenTuple = [string, Record<string, any>];
export type DxWhenCondition = DxWhenTuple | DxWhenTuple[];

/**
 * User-settable common fields available on ALL decorator types.
 */
export interface DxCommonFields {
  uid?: string;
  tags?: string[];
  size?: number;
  /** Per-state property overrides. Keys are state names (use `$` for hierarchy). */
  states?: Record<string, Record<string, any>>;
  /** Inline condition: `[expr, overrides]` or `[[expr, overrides], ...]`. */
  when?: DxWhenCondition;
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
  onLoad?: DxEventHandler;
  onChange?: DxEventHandler;
  onFilter?: DxEventHandler;
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
 */
export interface DxLayoutBase {
  onChange?: DxEventHandler;
}

/**
 * PUBLIC base for display decorators.
 * Displays are render-function-only — no shared properties beyond uid.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
export interface DxDisplayBase {
  // intentionally empty
}
