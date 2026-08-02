import type { ArrayValidator } from '@golemui/gui-validators';
import type { RangeTimeInputProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface RangeTimeInputDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<RangeTimeInputProps> {
  type: 'rangeTimeInput';
  validator?: DxValidator<ArrayValidator>;
}

export interface GslRangeTimeInputConfig extends GslConfigBase<RangeTimeInputDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type RangeTimeInputEntry = { key: string; def: DefOrCallback<RangeTimeInputDecorator> };
export type GuiRangeTimeInputShortcut = GuiShortcutOf<'RANGE_TIME_INPUT', RangeTimeInputEntry>;
