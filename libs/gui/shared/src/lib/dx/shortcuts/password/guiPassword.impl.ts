import { DxRuntimeParams } from '../../core/dxUtilityTypes';
import type { GuiPasswordShortcut, PasswordDecorator, PasswordEntry } from './password.domain';

export function _guiPassword(path: string): GuiPasswordShortcut;
export function _guiPassword(
  path: string,
  props: Partial<Omit<PasswordDecorator, 'type'>>,
): GuiPasswordShortcut;
export function _guiPassword(
  path: string,
  props: Partial<Omit<PasswordDecorator, 'type'>>,
  tags: string[],
): GuiPasswordShortcut;
export function _guiPassword(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<PasswordDecorator, 'type'>>,
  tags?: string[],
): GuiPasswordShortcut;
export function _guiPassword(
  path: string,
  propsOrCallback?:
    | Partial<Omit<PasswordDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<PasswordDecorator, 'type'>>),
  tags?: string[],
): GuiPasswordShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'password' as const, ...callback(params) });
    const items: PasswordEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'PASSWORD', items, tags: tags ?? [] };
  }

  const def: PasswordDecorator = { type: 'password', ...propsOrCallback };
  const items: PasswordEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'PASSWORD', items, tags: tags ?? [] };
}
