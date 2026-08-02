import type { ArrayValidator } from '@golemui/gui-validators';
import type { RangeDateTimeInputProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface RangeDateTimeInputDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<RangeDateTimeInputProps> {
  type: 'rangeDateTimeInput';
  validator?: DxValidator<ArrayValidator>;
}

export interface GslRangeDateTimeInputConfig extends GslConfigBase<RangeDateTimeInputDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type RangeDateTimeInputEntry = {
  key: string;
  def: DefOrCallback<RangeDateTimeInputDecorator>;
};
export type GuiRangeDateTimeInputShortcut = GuiShortcutOf<
  'RANGE_DATE_TIME_INPUT',
  RangeDateTimeInputEntry
>;
