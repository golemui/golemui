import type { StringValidator } from '@golemui/gui-validators';
import { type CalendarProps } from '../../../widget.props';
import { type DxCommonFields, type DxInputBase, type DxInternalFields } from '@golemui/dx';
import { type DefOrCallback, type GslConfigBase, type GuiShortcutOf } from '@golemui/dx';
import { type DxValidator } from '@golemui/dx';

// ═══════════════════════════════════════════════════
// Calendar Decorators
// ═══════════════════════════════════════════════════

export interface CalendarDecorator extends DxInputBase, DxCommonFields, Partial<CalendarProps> {
  type: 'calendar';
  validator?: DxValidator<StringValidator>;
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

export interface GslCalendarConfig extends GslConfigBase<CalendarDecorator> {
  suppressAutomaticLabels?: boolean;
}

// ═══════════════════════════════════════════════════
// GUI Calendar Types
// ═══════════════════════════════════════════════════

export type CalendarEntry = DefOrCallback<CalendarDecorator>;

export type GuiCalendarShortcut = GuiShortcutOf<'CALENDAR', CalendarEntry>;
