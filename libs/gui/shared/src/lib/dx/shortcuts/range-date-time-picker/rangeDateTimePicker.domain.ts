import type { ArrayValidator } from '@golemui/gui-validators';
import type { RangeDateTimePickerProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface RangeDateTimePickerDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<RangeDateTimePickerProps> {
  type: 'rangeDateTimePicker';
  validator?: DxValidator<ArrayValidator>;
}

export interface GslRangeDateTimePickerConfig extends GslConfigBase<RangeDateTimePickerDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type RangeDateTimePickerEntry = {
  key: string;
  def: DefOrCallback<RangeDateTimePickerDecorator>;
};
export type GuiRangeDateTimePickerShortcut = GuiShortcutOf<
  'RANGE_DATE_TIME_PICKER',
  RangeDateTimePickerEntry
>;
