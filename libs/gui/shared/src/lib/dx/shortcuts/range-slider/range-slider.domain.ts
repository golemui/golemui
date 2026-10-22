import type { RangeValidator } from '@golemui/gui-validators';
import type { RangeSliderProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface RangeSliderDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<RangeSliderProps> {
  type: 'rangeSlider';
  validator?: DxValidator<RangeValidator>;
}

export interface GslRangeSliderConfig extends GslConfigBase<RangeSliderDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type RangeSliderEntry = { key: string; def: DefOrCallback<RangeSliderDecorator> };
export type GuiRangeSliderShortcut = GuiShortcutOf<'RANGE_SLIDER', RangeSliderEntry>;
