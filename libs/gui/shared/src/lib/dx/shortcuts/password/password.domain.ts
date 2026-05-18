import type { StringValidator } from '@golemui/gui-validators';
import type { PasswordProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';
import type { DxValidator } from '../../core/dxValidatorHelper';

export interface PasswordDecorator extends DxInputBase, DxCommonFields, Partial<PasswordProps> {
  type: 'password';
  validator?: DxValidator<StringValidator>;
}

export interface GslPasswordConfig extends GslConfigBase<PasswordDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

export type PasswordEntry = { key: string; def: DefOrCallback<PasswordDecorator> };
export type GuiPasswordShortcut = GuiShortcutOf<'PASSWORD', PasswordEntry>;
