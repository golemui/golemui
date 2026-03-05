import type { GuiTextareaShortcut, TextareaDecorator, TextareaEntry } from './textarea.domain';

type TextareaFieldMap = Record<string, TextareaDecorator | string>;

export function _guiTextarea(fields: TextareaFieldMap, tags?: string[]): GuiTextareaShortcut {
  const items: TextareaEntry[] = Object.entries(fields).map(([key, value]) => ({
    key,
    def: typeof value === 'string'
      ? { type: 'textarea', path: key, placeholder: value }
      : { ...value, type: 'textarea' },
  }));
  return { type: 'ITEMS', itemType: 'TEXTAREA', items, tags: tags ?? [] };
}
