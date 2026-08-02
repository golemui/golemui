import type { ArrayValidator } from '@golemui/gui-validators';
import type { RangeDatePickerProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface RangeDatePickerDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<RangeDatePickerProps> {
  type: 'rangeDatePicker';
  validator?: DxValidator<ArrayValidator>;
}

export interface GslRangeDatePickerConfig extends GslConfigBase<RangeDatePickerDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

export type RangeDatePickerEntry = { key: string; def: DefOrCallback<RangeDatePickerDecorator> };
export type GuiRangeDatePickerShortcut = GuiShortcutOf<'RANGE_DATE_PICKER', RangeDatePickerEntry>;
