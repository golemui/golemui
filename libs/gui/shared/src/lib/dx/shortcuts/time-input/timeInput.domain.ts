import type { StringValidator } from '@golemui/gui-validators';
import type { TimeInputProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface TimeInputDecorator extends DxInputBase, DxCommonFields, Partial<TimeInputProps> {
  type: 'timeInput';
  validator?: DxValidator<StringValidator>;
}

export interface GslTimeInputConfig extends GslConfigBase<TimeInputDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type TimeInputEntry = { key: string; def: DefOrCallback<TimeInputDecorator> };
export type GuiTimeInputShortcut = GuiShortcutOf<'TIME_INPUT', TimeInputEntry>;
