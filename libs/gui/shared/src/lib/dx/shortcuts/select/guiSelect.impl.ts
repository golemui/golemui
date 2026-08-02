import { type DxRuntimeParams } from '@golemui/dx';
import type { GuiSelectShortcut, SelectDecorator, SelectEntry } from './select.domain';

type SelectFactoryProps = Omit<SelectDecorator, 'type'>;

export function _guiSelect(path: string, props: SelectFactoryProps): GuiSelectShortcut;
export function _guiSelect(
  path: string,
  props: SelectFactoryProps,
  tags: string[],
): GuiSelectShortcut;
export function _guiSelect(
  path: string,
  callback: (params: DxRuntimeParams) => SelectFactoryProps,
  tags?: string[],
): GuiSelectShortcut;
export function _guiSelect(
  path: string,
  propsOrCallback: SelectFactoryProps | ((params: DxRuntimeParams) => SelectFactoryProps),
  tags?: string[],
): GuiSelectShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'select' as const, ...callback(params) });
    const items: SelectEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'SELECT', items, tags: tags ?? [] };
  }

  const def: SelectDecorator = { type: 'select', ...propsOrCallback };
  const items: SelectEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'SELECT', items, tags: tags ?? [] };
}
