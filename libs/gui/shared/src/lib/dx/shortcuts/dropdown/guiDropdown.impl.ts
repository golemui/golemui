import type { DxRuntimeParams } from '../../core/dxUtilityTypes';
import type { DropdownDecorator, DropdownEntry, GuiDropdownShortcut } from './dropdown.domain';

type DropdownFactoryProps = Omit<DropdownDecorator, 'type'>;

export function _guiDropdown(path: string, props: DropdownFactoryProps): GuiDropdownShortcut;
export function _guiDropdown(
  path: string,
  props: DropdownFactoryProps,
  tags: string[],
): GuiDropdownShortcut;
export function _guiDropdown(
  path: string,
  callback: (params: DxRuntimeParams) => DropdownFactoryProps,
  tags?: string[],
): GuiDropdownShortcut;
export function _guiDropdown(
  path: string,
  propsOrCallback: DropdownFactoryProps | ((params: DxRuntimeParams) => DropdownFactoryProps),
  tags?: string[],
): GuiDropdownShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'dropdown' as const,
      ...callback(params),
    });
    const items: DropdownEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'DROPDOWN', items, tags: tags ?? [] };
  }

  const def: DropdownDecorator = { type: 'dropdown', ...propsOrCallback };
  const items: DropdownEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'DROPDOWN', items, tags: tags ?? [] };
}
