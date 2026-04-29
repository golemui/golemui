import type { NumberValidator } from '@golemui/gui-validators';
import type { CurrencyProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';

export interface CurrencyDecorator extends DxInputBase, DxCommonFields, Partial<CurrencyProps> {
  type: 'currency';
  validator?: Omit<NumberValidator, 'type'>;
}

export interface GslCurrencyConfig extends GslConfigBase<CurrencyDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

export type CurrencyEntry = { key: string; def: DefOrCallback<CurrencyDecorator> };
export type GuiCurrencyShortcut = GuiShortcutOf<'CURRENCY', CurrencyEntry>;
