import type { StringValidator } from '@golemui/gui-validators';
import type { DatePickerProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

// ═══════════════════════════════════════════════════
// DatePicker Decorator
// ═══════════════════════════════════════════════════

export interface DatePickerDecorator extends DxInputBase, DxCommonFields, Partial<DatePickerProps> {
  type: 'datePicker';
  validator?: DxValidator<StringValidator>;
}

// ═══════════════════════════════════════════════════
// GSL DatePicker Types
// ═══════════════════════════════════════════════════

export interface GslDatePickerConfig extends GslConfigBase<DatePickerDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

// ═══════════════════════════════════════════════════
// GUI DatePicker Types
// ═══════════════════════════════════════════════════

export type DatePickerEntry = {
  key: string;
  def: DefOrCallback<DatePickerDecorator>;
};

export type GuiDatePickerShortcut = GuiShortcutOf<'DATE_PICKER', DatePickerEntry>;
