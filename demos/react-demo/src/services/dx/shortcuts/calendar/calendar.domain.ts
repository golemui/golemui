import { CalendarProps } from '@golemui/gui-shared';
import { DxCommonFields, DxInputBase, DxInternalFields } from '../../core/dxBase.types';
import {
  DefOrCallback,
  GslConfigBase,
  GuiShortcutOf,
} from '../../core/dxUtilityTypes';

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

export interface GslCalendarConfig extends GslConfigBase<CalendarDecorator> {
  suppressAutomaticLabels?: boolean;
}

// ═══════════════════════════════════════════════════
// GUI Calendar Types
// ═══════════════════════════════════════════════════

export type CalendarEntry = DefOrCallback<CalendarDecorator>;

export type GuiCalendarShortcut = GuiShortcutOf<'CALENDAR', CalendarEntry>;
