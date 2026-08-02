import type { ArrayValidator } from '@golemui/gui-validators';
import type { RangeTimePickerProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface RangeTimePickerDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<RangeTimePickerProps> {
  type: 'rangeTimePicker';
  validator?: DxValidator<ArrayValidator>;
}

export interface GslRangeTimePickerConfig extends GslConfigBase<RangeTimePickerDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type RangeTimePickerEntry = { key: string; def: DefOrCallback<RangeTimePickerDecorator> };
export type GuiRangeTimePickerShortcut = GuiShortcutOf<'RANGE_TIME_PICKER', RangeTimePickerEntry>;
