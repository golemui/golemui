import type { ArrayValidator } from '@golemui/gui-validators';
import type { CheckboxGroupProps, Option, OptionValue } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface CheckboxGroupDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<Omit<CheckboxGroupProps, 'options'>> {
  type: 'checkboxGroup';
  options?: Option[] | OptionValue[] | Record<string, unknown>[];
  validator?: DxValidator<ArrayValidator>;
}

export interface GslCheckboxGroupConfig extends GslConfigBase<CheckboxGroupDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type CheckboxGroupEntry = { key: string; def: DefOrCallback<CheckboxGroupDecorator> };
export type GuiCheckboxGroupShortcut = GuiShortcutOf<'CHECKBOX_GROUP', CheckboxGroupEntry>;
