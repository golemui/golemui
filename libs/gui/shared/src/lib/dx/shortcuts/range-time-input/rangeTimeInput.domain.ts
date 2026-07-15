import type { ArrayValidator } from '@golemui/gui-validators';
import type { RangeTimeInputProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';
import type { DxValidator } from '../../core/dxValidatorHelper';

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
