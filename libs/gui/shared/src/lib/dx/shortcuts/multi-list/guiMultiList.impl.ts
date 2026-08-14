import { type DxRuntimeParams } from '@golemui/dx';
import type {
  GuiMultiListShortcut,
  MultiListDecorator,
  MultiListEntry,
} from './multi-list.domain';

type MultiListFactoryProps = Omit<MultiListDecorator, 'type'>;

export function _guiMultiList(path: string, props: MultiListFactoryProps): GuiMultiListShortcut;
export function _guiMultiList(
  path: string,
  props: MultiListFactoryProps,
  tags: string[],
): GuiMultiListShortcut;
export function _guiMultiList(
  path: string,
  callback: (params: DxRuntimeParams) => MultiListFactoryProps,
  tags?: string[],
): GuiMultiListShortcut;
export function _guiMultiList(
  path: string,
  propsOrCallback: MultiListFactoryProps | ((params: DxRuntimeParams) => MultiListFactoryProps),
  tags?: string[],
): GuiMultiListShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'multiList' as const, ...callback(params) });
    const items: MultiListEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'MULTI_LIST', items, tags: tags ?? [] };
  }

  const def: MultiListDecorator = { type: 'multiList', ...propsOrCallback };
  const items: MultiListEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'MULTI_LIST', items, tags: tags ?? [] };
}
