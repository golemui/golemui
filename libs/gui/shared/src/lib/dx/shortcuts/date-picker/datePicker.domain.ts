import type { DatePickerProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type {
  DefOrCallback,
  GslConfigBase,
  GuiShortcutOf,
} from '../../core/dxUtilityTypes';

// ═══════════════════════════════════════════════════
// DatePicker Decorator
// ═══════════════════════════════════════════════════

export interface DatePickerDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<DatePickerProps> {
  type: 'datePicker';
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
