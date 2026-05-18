import type { ArrayValidator } from '@golemui/gui-validators';
import type { RangeDateInputProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';
import type { DxValidator } from '../../core/dxValidatorHelper';

export interface RangeDateInputDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<RangeDateInputProps> {
  type: 'rangeDateInput';
  validator?: DxValidator<ArrayValidator>;
}

export interface GslRangeDateInputConfig extends GslConfigBase<RangeDateInputDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type RangeDateInputEntry = { key: string; def: DefOrCallback<RangeDateInputDecorator> };
export type GuiRangeDateInputShortcut = GuiShortcutOf<'RANGE_DATE_INPUT', RangeDateInputEntry>;
