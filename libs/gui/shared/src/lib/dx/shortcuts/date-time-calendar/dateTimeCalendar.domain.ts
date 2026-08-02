import type { StringValidator } from '@golemui/gui-validators';
import { type DateTimeCalendarProps } from '../../../widget.props';
import { type DxCommonFields, type DxInputBase, type DxInternalFields } from '@golemui/dx';
import { type DefOrCallback, type GslConfigBase, type GuiShortcutOf } from '@golemui/dx';
import { type DxValidator } from '@golemui/dx';

// ═══════════════════════════════════════════════════
// DateTimeCalendar Decorators
// ═══════════════════════════════════════════════════

export interface DateTimeCalendarDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<DateTimeCalendarProps> {
  type: 'dateTimeCalendar';
  validator?: DxValidator<StringValidator>;
}

/**
 * Full decorator type including pipeline-internal fields.
 * Used by the pipeline only — form authors use DateTimeCalendarDecorator.
 */
export type DateTimeCalendarDecoratorFull = DateTimeCalendarDecorator & DxInternalFields;

// ═══════════════════════════════════════════════════
// DateTimeCalendar Sensible Defaults Config
// ═══════════════════════════════════════════════════

export interface DateTimeCalendarSensibleDefaultsConfig {
  suppressAutomaticLabels?: boolean;
}

// ═══════════════════════════════════════════════════
// GSL DateTimeCalendar Types
// ═══════════════════════════════════════════════════

export interface GslDateTimeCalendarConfig extends GslConfigBase<DateTimeCalendarDecorator> {
  suppressAutomaticLabels?: boolean;
}

// ═══════════════════════════════════════════════════
// GUI DateTimeCalendar Types
// ═══════════════════════════════════════════════════

export type DateTimeCalendarEntry = DefOrCallback<DateTimeCalendarDecorator>;

export type GuiDateTimeCalendarShortcut = GuiShortcutOf<
  'DATE_TIME_CALENDAR',
  DateTimeCalendarEntry
>;
