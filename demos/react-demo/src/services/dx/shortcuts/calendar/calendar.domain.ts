import { RuntimeFunction, GuiItemsShortcut } from '../../core/dx.domain';
import { DxRuntimeParams } from '../inputs/inputs.domain';
import { WidgetItemDecorator } from '../../formDef.domain';

// ═══════════════════════════════════════════════════
// Calendar Decorators
// ═══════════════════════════════════════════════════

export interface CalendarDecorator extends WidgetItemDecorator {
  type: 'calendar';
  path?: string;
  label?: string | null;
  minDate?: string;
  maxDate?: string;
}

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
