import type { DxRuntimeParams } from '@golemui/dx';
import type {
  GuiMultiDropdownShortcut,
  MultiDropdownDecorator,
  MultiDropdownEntry,
} from './multi-dropdown.domain';

type MultiDropdownFactoryProps = Omit<MultiDropdownDecorator, 'type'>;

export function _guiMultiDropdown(
  path: string,
  props: MultiDropdownFactoryProps,
): GuiMultiDropdownShortcut;
export function _guiMultiDropdown(
  path: string,
  props: MultiDropdownFactoryProps,
  tags: string[],
): GuiMultiDropdownShortcut;
export function _guiMultiDropdown(
  path: string,
  callback: (params: DxRuntimeParams) => MultiDropdownFactoryProps,
  tags?: string[],
): GuiMultiDropdownShortcut;
export function _guiMultiDropdown(
  path: string,
  propsOrCallback:
    | MultiDropdownFactoryProps
    | ((params: DxRuntimeParams) => MultiDropdownFactoryProps),
  tags?: string[],
): GuiMultiDropdownShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'multiDropdown' as const,
      ...callback(params),
    });
    const items: MultiDropdownEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'MULTI_DROPDOWN', items, tags: tags ?? [] };
  }

  const def: MultiDropdownDecorator = { type: 'multiDropdown', ...propsOrCallback };
  const items: MultiDropdownEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'MULTI_DROPDOWN', items, tags: tags ?? [] };
}
