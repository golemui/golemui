import { DxRuntimeParams } from '../../core/dxUtilityTypes';
import type { GuiListShortcut, ListDecorator, ListEntry } from './list.domain';

type ListFactoryProps = Omit<ListDecorator, 'type'>;

export function _guiList(path: string, props: ListFactoryProps): GuiListShortcut;
export function _guiList(path: string, props: ListFactoryProps, tags: string[]): GuiListShortcut;
export function _guiList(
  path: string,
  callback: (params: DxRuntimeParams) => ListFactoryProps,
  tags?: string[],
): GuiListShortcut;
export function _guiList(
  path: string,
  propsOrCallback: ListFactoryProps | ((params: DxRuntimeParams) => ListFactoryProps),
  tags?: string[],
): GuiListShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'list' as const, ...callback(params) });
    const items: ListEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'LIST', items, tags: tags ?? [] };
  }

  const def: ListDecorator = { type: 'list', ...propsOrCallback };
  const items: ListEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'LIST', items, tags: tags ?? [] };
}
