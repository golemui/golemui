import type { BooleanValidator } from '@golemui/gui-validators';
import type { CheckboxProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';

export interface CheckboxDecorator extends DxInputBase, DxCommonFields, Partial<CheckboxProps> {
  type: 'checkbox';
  validator?: Omit<BooleanValidator, 'type'>;
}

export interface GslCheckboxConfig extends GslConfigBase<CheckboxDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type CheckboxEntry = { key: string; def: DefOrCallback<CheckboxDecorator> };
export type GuiCheckboxShortcut = GuiShortcutOf<'CHECKBOX', CheckboxEntry>;
