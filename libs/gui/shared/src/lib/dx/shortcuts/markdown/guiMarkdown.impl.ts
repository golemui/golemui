import { type DxRuntimeParams } from '../../core/dxUtilityTypes';
import type { GuiMarkdownShortcut, MarkdownDecorator, MarkdownEntry } from './markdown.domain';

export function _guiMarkdown(path: string): GuiMarkdownShortcut;
export function _guiMarkdown(
  path: string,
  props: Partial<Omit<MarkdownDecorator, 'type'>>,
): GuiMarkdownShortcut;
export function _guiMarkdown(
  path: string,
  props: Partial<Omit<MarkdownDecorator, 'type'>>,
  tags: string[],
): GuiMarkdownShortcut;
export function _guiMarkdown(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<MarkdownDecorator, 'type'>>,
  tags?: string[],
): GuiMarkdownShortcut;
export function _guiMarkdown(
  path: string,
  propsOrCallback?:
    | Partial<Omit<MarkdownDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<MarkdownDecorator, 'type'>>),
  tags?: string[],
): GuiMarkdownShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'markdown' as const, ...callback(params) });
    const items: MarkdownEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'MARKDOWN', items, tags: tags ?? [] };
  }

  const def: MarkdownDecorator = { type: 'markdown', ...propsOrCallback };
  const items: MarkdownEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'MARKDOWN', items, tags: tags ?? [] };
}
