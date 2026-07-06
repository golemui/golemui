import type { StringValidator } from '@golemui/gui-validators';
import type { TimePickerProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';
import type { DxValidator } from '../../core/dxValidatorHelper';

// ═══════════════════════════════════════════════════
// TimePicker Decorator
// ═══════════════════════════════════════════════════

export interface TimePickerDecorator extends DxInputBase, DxCommonFields, Partial<TimePickerProps> {
  type: 'timePicker';
  validator?: DxValidator<StringValidator>;
}

// ═══════════════════════════════════════════════════
// GSL TimePicker Types
// ═══════════════════════════════════════════════════

export interface GslTimePickerConfig extends GslConfigBase<TimePickerDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

// ═══════════════════════════════════════════════════
// GUI TimePicker Types
// ═══════════════════════════════════════════════════

export type TimePickerEntry = {
  key: string;
  def: DefOrCallback<TimePickerDecorator>;
};

export type GuiTimePickerShortcut = GuiShortcutOf<'TIME_PICKER', TimePickerEntry>;
