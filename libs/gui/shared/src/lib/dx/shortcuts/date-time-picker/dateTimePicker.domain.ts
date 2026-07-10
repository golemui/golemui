import type { StringValidator } from '@golemui/gui-validators';
import type { DateTimePickerProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';
import type { DxValidator } from '../../core/dxValidatorHelper';

// ═══════════════════════════════════════════════════
// DateTimePicker Decorator
// ═══════════════════════════════════════════════════

export interface DateTimePickerDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<DateTimePickerProps> {
  type: 'dateTimePicker';
  validator?: DxValidator<StringValidator>;
}

// ═══════════════════════════════════════════════════
// GSL DateTimePicker Types
// ═══════════════════════════════════════════════════

export interface GslDateTimePickerConfig extends GslConfigBase<DateTimePickerDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

// ═══════════════════════════════════════════════════
// GUI DateTimePicker Types
// ═══════════════════════════════════════════════════

export type DateTimePickerEntry = {
  key: string;
  def: DefOrCallback<DateTimePickerDecorator>;
};

export type GuiDateTimePickerShortcut = GuiShortcutOf<'DATE_TIME_PICKER', DateTimePickerEntry>;
