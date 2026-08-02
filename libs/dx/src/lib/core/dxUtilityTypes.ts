// ═══════════════════════════════════════════════════
// DX Shared Utility Types — collapse per-type domain boilerplate
// ═══════════════════════════════════════════════════

import type { FunctionWidgetParams } from '@golemui/core';
import type { RuntimeFunction, GuiItemsShortcut, GslLeafSelector } from './dx.domain';

export type DxRuntimeParams<FormData = any> = FunctionWidgetParams<FormData>;

/**
 * Generic GSL decorator callback — same structure for every type.
 * Usage: replace per-type `GslCalendarDecoratorCallback`, `GslInputDecoratorCallback`, etc.
 */
export type GslDecoratorCallback<D> = (current: D) => Partial<D> | RuntimeFunction;

/**
 * A field definition can be a static decorator or a runtime callback.
 * Usage: replace per-type `CalendarDefOrCallback`, `ActionDefOrCallback`, etc.
 */
export type DefOrCallback<D, TForm = any> = D | ((params: DxRuntimeParams<TForm>) => Partial<D>);

/**
 * Standard GSL config shape — override + optional suppress flags.
 * Extend this for types that have additional GSL config fields.
 * Usage: replace per-type `GslCalendarConfig`, `GslInputConfig`, etc. base shape.
 */
export interface GslConfigBase<D> {
  override?: Partial<D> | GslDecoratorCallback<D>;
}

/**
 * Typed GUI shortcut sub-interface.
 * Usage: replace per-type `GuiCalendarShortcut`, `GuiInputsShortcut`, etc.
 */
export interface GuiShortcutOf<TItemType extends string, TEntry> extends GuiItemsShortcut {
  itemType: TItemType;
  items: TEntry[];
}

/**
 * Creates a GSL selector factory for a given shortcut type.
 * Eliminates the need for per-type gsl*.impl.ts files.
 *
 * @example
 * ```ts
 * export const _gslCalendars = createGslSelector<CalendarDecorator, GslCalendarConfig>('CALENDAR');
 * // Equivalent to the hand-written gslCalendar.impl.ts factory
 * ```
 */
export function createGslSelector<D, TConfig extends GslConfigBase<D> = GslConfigBase<D>>(
  selectorType: string,
) {
  return function (
    config: TConfig,
    matcher: (decorator: D) => boolean = () => true,
  ): GslLeafSelector {
    return {
      kind: 'leaf',
      selectorType,
      matcher,
      config,
    };
  };
}
