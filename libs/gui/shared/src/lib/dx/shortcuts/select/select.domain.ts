import type { Validator } from '@golemui/gui-validators';
import type { Option, OptionValue, SelectProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';

export interface SelectDecorator
  extends DxInputBase,
    DxCommonFields,
    Partial<Omit<SelectProps, 'options'>> {
  type: 'select';
  options?: Option[] | OptionValue[] | Record<string, unknown>[];
  validator?: Validator;
}

export interface GslSelectConfig extends GslConfigBase<SelectDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

export type SelectEntry = { key: string; def: DefOrCallback<SelectDecorator> };
export type GuiSelectShortcut = GuiShortcutOf<'SELECT', SelectEntry>;
