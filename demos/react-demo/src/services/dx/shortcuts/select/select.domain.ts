import type { Option, SelectProps } from '@golemui/gui-shared';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';

export interface SelectDecorator extends DxInputBase, DxCommonFields, Partial<SelectProps> {
  type: 'select';
  options: Option[];
}

export interface GslSelectConfig extends GslConfigBase<SelectDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

export type SelectEntry = { key: string; def: DefOrCallback<SelectDecorator> };
export type GuiSelectShortcut = GuiShortcutOf<'SELECT', SelectEntry>;
