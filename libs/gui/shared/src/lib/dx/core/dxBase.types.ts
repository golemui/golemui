// ═══════════════════════════════════════════════════
// DX Base Types — public and internal decorator bases
// ═══════════════════════════════════════════════════

import type { ActionWidget, FormEvent, Localizable, ReactiveExpression } from '@golemui/core';

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
 *
 * Function-only, mirroring action `onClick`. Bare strings are NOT accepted — a stray
 * `onChange: 'something'` is a footgun (it looks like a value, not a handler), so the
 * type rejects it.
 *
 * - Return a string to wire a host-managed event name (e.g. `onChange: () => 'fieldChange'`
 *   dispatches `fieldChange` to the host event bus). Only zero-arg handlers are probed for
 *   this, so the `event` parameter is never touched at build time.
 * - Otherwise the handler runs on dispatch; use `event.update(...)` to push widget changes.
 *
 * @example
 * // Host-managed dispatch by name:
 * onChange: () => 'fieldChange'
 * @example
 * // Imperative handler:
 * onChange: (event) => event.update({ path: 'country', options: [] })
 */
export type DxEventHandler = (event: DxFormEvent) => void | string;

/**
 * INTERNAL decorator fields — used by the pipeline, NOT by form authors.
 * Contains fields that the pipeline needs but users should never set.
 */
export interface DxInternalFields {
  itemType?: string;
  removeField?: boolean;
  /**
   * Sub-type discriminator on the decorator (e.g. `'text' | 'number' | 'boolean'`
   * for inputs that share the `INPUTS` itemType, `'password'`, `'dropdown'`, etc.
   * for top-level itemTypes). Carried into the matching phase so sub-type
   * matchers like `_gslTextInputs((d) => d.type === 'text')` work.
   */
  type?: string;
}

/**
 * Conditional inclusion: state-list or reactive expression form.
 * Mirrors core's `include` shape on `BaseWidget`.
 */
export type DxIncludeCondition = { in: string[] } | { when: ReactiveExpression };

/**
 * Conditional exclusion: state-list or reactive expression form.
 * Mirrors core's `exclude` shape on `BaseWidget`.
 */
export type DxExcludeCondition = { from: string[] } | { when: ReactiveExpression };

/**
 * User-settable common fields available on ALL decorator types.
 */
export interface DxCommonFields {
  uid?: string;
  tags?: string[];
  size?: number;
  /**
   * Per-state property overrides. Keys are state names (use `:` for hierarchy).
   *
   * NOTE: the override values are an untyped escape hatch (`Record<string, any>`), so they
   * are NOT type-checked — e.g. `states: { editing: { onChange: 'foo' } }` compiles even
   * though a top-level `onChange: 'foo'` does not (events are function-only).
   */
  states?: Record<string, Record<string, any>>;
  /** Conditionally include the widget — by active state list or reactive expression. */
  include?: DxIncludeCondition;
  /** Conditionally exclude the widget — by active state list or reactive expression. */
  exclude?: DxExcludeCondition;
}

/**
 * PUBLIC base for input-like decorators.
 * Clean projection of InputWidget properties — no generics, no SomeSuffixable.
 */
export interface DxInputBase {
  path?: string;
  label?: Localizable | null;
  disabled?: boolean | { when: ReactiveExpression };
  readonly?: boolean | { when: ReactiveExpression };
  defaultValue?: unknown;
  onLoad?: DxEventHandler;
  onChange?: DxEventHandler;
  onFilter?: DxEventHandler;
  onBlur?: DxEventHandler;
}

/**
 * PUBLIC base for action decorators.
 */
export interface DxActionBase {
  label?: Localizable;
  disabled?: boolean | { when: ReactiveExpression };
  actionType?: ActionWidget['actionType'];
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
