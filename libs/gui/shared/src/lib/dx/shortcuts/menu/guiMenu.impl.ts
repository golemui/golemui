import type { DxRuntimeParams } from '@golemui/dx';
import type { GuiMenuShortcut, MenuDecorator, MenuEntry } from './menu.domain';

export function _guiMenu(props: MenuDecorator, tags?: string[]): GuiMenuShortcut;
export function _guiMenu(
  callback: (params: DxRuntimeParams) => MenuDecorator,
  tags?: string[],
): GuiMenuShortcut;
export function _guiMenu(
  propsOrCallback: MenuDecorator | ((params: DxRuntimeParams) => MenuDecorator),
  tags?: string[],
): GuiMenuShortcut {
  const items: MenuEntry[] = [propsOrCallback];
  return { type: 'ITEMS', itemType: 'MENUS', items, tags: tags ?? [] };
}
