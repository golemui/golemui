import { DxRuntimeParams } from '../../core/dxUtilityTypes';
import type { GuiTextareaShortcut, TextareaDecorator, TextareaEntry } from './textarea.domain';

export function _guiTextarea(path: string): GuiTextareaShortcut;
export function _guiTextarea(
  path: string,
  props: Partial<Omit<TextareaDecorator, 'type'>>,
): GuiTextareaShortcut;
export function _guiTextarea(
  path: string,
  props: Partial<Omit<TextareaDecorator, 'type'>>,
  tags: string[],
): GuiTextareaShortcut;
export function _guiTextarea(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<TextareaDecorator, 'type'>>,
  tags?: string[],
): GuiTextareaShortcut;
export function _guiTextarea(
  path: string,
  propsOrCallback?:
    | Partial<Omit<TextareaDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<TextareaDecorator, 'type'>>),
  tags?: string[],
): GuiTextareaShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'textarea' as const, ...callback(params) });
    const items: TextareaEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'TEXTAREA', items, tags: tags ?? [] };
  }

  const def: TextareaDecorator = { type: 'textarea', ...propsOrCallback };
  const items: TextareaEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'TEXTAREA', items, tags: tags ?? [] };
}
