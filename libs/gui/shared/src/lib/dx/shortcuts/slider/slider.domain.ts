import type { NumberValidator } from '@golemui/gui-validators';
import type { SliderProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface SliderDecorator extends DxInputBase, DxCommonFields, Partial<SliderProps> {
  type: 'slider';
  validator?: DxValidator<NumberValidator>;
}

export interface GslSliderConfig extends GslConfigBase<SliderDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type SliderEntry = { key: string; def: DefOrCallback<SliderDecorator> };
export type GuiSliderShortcut = GuiShortcutOf<'SLIDER', SliderEntry>;
