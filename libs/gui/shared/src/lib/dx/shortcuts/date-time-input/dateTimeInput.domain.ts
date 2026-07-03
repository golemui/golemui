import type { StringValidator } from '@golemui/gui-validators';
import type { DateTimeInputProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';
import type { DxValidator } from '../../core/dxValidatorHelper';

export interface DateTimeInputDecorator extends DxInputBase, DxCommonFields, Partial<DateTimeInputProps> {
  type: 'dateTimeInput';
  validator?: DxValidator<StringValidator>;
}

export interface GslDateTimeInputConfig extends GslConfigBase<DateTimeInputDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type DateTimeInputEntry = { key: string; def: DefOrCallback<DateTimeInputDecorator> };
export type GuiDateTimeInputShortcut = GuiShortcutOf<'DATE_TIME_INPUT', DateTimeInputEntry>;
