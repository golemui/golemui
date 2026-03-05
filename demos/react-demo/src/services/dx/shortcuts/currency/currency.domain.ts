import type { CurrencyProps } from '@golemui/gui-shared';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';

export interface CurrencyDecorator extends DxInputBase, DxCommonFields, Partial<CurrencyProps> {
  type: 'currency';
}

export interface GslCurrencyConfig extends GslConfigBase<CurrencyDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

export type CurrencyEntry = { key: string; def: DefOrCallback<CurrencyDecorator> };
export type GuiCurrencyShortcut = GuiShortcutOf<'CURRENCY', CurrencyEntry>;
