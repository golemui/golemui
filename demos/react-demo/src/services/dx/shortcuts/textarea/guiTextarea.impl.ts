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
  props?: Partial<Omit<TextareaDecorator, 'type'>>,
  tags?: string[],
): GuiTextareaShortcut {
  const def: TextareaDecorator = { type: 'textarea', path, ...props };
  const items: TextareaEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'TEXTAREA', items, tags: tags ?? [] };
}
