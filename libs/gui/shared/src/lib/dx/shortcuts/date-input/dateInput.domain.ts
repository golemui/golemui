import type { StringValidator } from '@golemui/gui-validators';
import type { DateinputProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface DateInputDecorator extends DxInputBase, DxCommonFields, Partial<DateinputProps> {
  type: 'dateInput';
  validator?: DxValidator<StringValidator>;
}

export interface GslDateInputConfig extends GslConfigBase<DateInputDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type DateInputEntry = { key: string; def: DefOrCallback<DateInputDecorator> };
export type GuiDateInputShortcut = GuiShortcutOf<'DATE_INPUT', DateInputEntry>;
