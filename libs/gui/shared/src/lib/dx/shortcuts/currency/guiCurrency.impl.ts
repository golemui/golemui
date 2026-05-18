import { type DxRuntimeParams } from '../../core/dxUtilityTypes';
import type { CurrencyDecorator, CurrencyEntry, GuiCurrencyShortcut } from './currency.domain';

export function _guiCurrency(path: string): GuiCurrencyShortcut;
export function _guiCurrency(
  path: string,
  props: Partial<Omit<CurrencyDecorator, 'type'>>,
): GuiCurrencyShortcut;
export function _guiCurrency(
  path: string,
  props: Partial<Omit<CurrencyDecorator, 'type'>>,
  tags: string[],
): GuiCurrencyShortcut;
export function _guiCurrency(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<CurrencyDecorator, 'type'>>,
  tags?: string[],
): GuiCurrencyShortcut;
export function _guiCurrency(
  path: string,
  propsOrCallback?:
    | Partial<Omit<CurrencyDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<CurrencyDecorator, 'type'>>),
  tags?: string[],
): GuiCurrencyShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'currency' as const, ...callback(params) });
    const items: CurrencyEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'CURRENCY', items, tags: tags ?? [] };
  }

  const def: CurrencyDecorator = { type: 'currency', ...propsOrCallback };
  const items: CurrencyEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'CURRENCY', items, tags: tags ?? [] };
}
