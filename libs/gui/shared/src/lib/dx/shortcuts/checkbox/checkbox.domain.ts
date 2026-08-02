import type { BooleanValidator } from '@golemui/gui-validators';
import type { CheckboxProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface CheckboxDecorator extends DxInputBase, DxCommonFields, Partial<CheckboxProps> {
  type: 'checkbox';
  validator?: DxValidator<BooleanValidator>;
}

export interface GslCheckboxConfig extends GslConfigBase<CheckboxDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type CheckboxEntry = { key: string; def: DefOrCallback<CheckboxDecorator> };
export type GuiCheckboxShortcut = GuiShortcutOf<'CHECKBOX', CheckboxEntry>;
