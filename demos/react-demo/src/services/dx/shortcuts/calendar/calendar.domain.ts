import { RuntimeFunction, GuiItemsShortcut } from '../../core/dx.domain';
import { CalendarProps } from '@golemui/gui-shared';
import { DxCommonFields, DxInputBase, DxInternalFields } from '../../core/dxBase.types';
import { DxRuntimeParams } from '../inputs/inputs.domain';

// ═══════════════════════════════════════════════════
// Calendar Decorators
// ═══════════════════════════════════════════════════

export interface CalendarDecorator extends DxInputBase, DxCommonFields {
  type: 'calendar';
  props?: Partial<CalendarProps>;
}

/**
 * Full decorator type including pipeline-internal fields.
 * Used by the pipeline only — form authors use CalendarDecorator.
 */
export type CalendarDecoratorFull = CalendarDecorator & DxInternalFields;

// ═══════════════════════════════════════════════════
// Calendar Sensible Defaults Config
// ═══════════════════════════════════════════════════

export interface CalendarSensibleDefaultsConfig {
  suppressAutomaticLabels?: boolean;
}

// ═══════════════════════════════════════════════════
// GSL Calendar Types
// ═══════════════════════════════════════════════════

export type GslCalendarDecoratorCallback = (current: CalendarDecorator) => Partial<CalendarDecorator> | RuntimeFunction;

export interface GslCalendarConfig {
  decorator?: Partial<CalendarDecorator> | GslCalendarDecoratorCallback;
  suppressAutomaticLabels?: boolean;
}

// ═══════════════════════════════════════════════════
// GUI Calendar Types
// ═══════════════════════════════════════════════════

export type PartialCalendarDefCallback = (
  params: DxRuntimeParams,
) => Partial<CalendarDecorator>;

export type CalendarDefOrCallback = CalendarDecorator | PartialCalendarDefCallback;

export type CalendarEntry = CalendarDefOrCallback;

export interface GuiCalendarShortcut extends GuiItemsShortcut {
  itemType: 'CALENDAR';
  items: CalendarEntry[];
}
