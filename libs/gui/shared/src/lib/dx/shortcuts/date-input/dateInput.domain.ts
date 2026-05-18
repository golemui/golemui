import type { StringValidator } from '@golemui/gui-validators';
import type { DateinputProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';
import type { DxValidator } from '../../core/dxValidatorHelper';

export interface DateInputDecorator extends DxInputBase, DxCommonFields, Partial<DateinputProps> {
  type: 'dateInput';
  validator?: DxValidator<StringValidator>;
}

export interface GslDateInputConfig extends GslConfigBase<DateInputDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type DateInputEntry = { key: string; def: DefOrCallback<DateInputDecorator> };
export type GuiDateInputShortcut = GuiShortcutOf<'DATE_INPUT', DateInputEntry>;
