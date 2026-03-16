import type { RangeDateInputProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';

export interface RangeDateInputDecorator extends DxInputBase, DxCommonFields, Partial<RangeDateInputProps> {
  type: 'rangeDateInput';
}

export interface GslRangeDateInputConfig extends GslConfigBase<RangeDateInputDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type RangeDateInputEntry = { key: string; def: DefOrCallback<RangeDateInputDecorator> };
export type GuiRangeDateInputShortcut = GuiShortcutOf<'RANGE_DATE_INPUT', RangeDateInputEntry>;
