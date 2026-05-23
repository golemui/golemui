import { type DxRuntimeParams } from '../../core/dxUtilityTypes';
import type { GuiTagsShortcut, TagsDecorator, TagsEntry } from './tags.domain';

export function _guiTags(path: string): GuiTagsShortcut;
export function _guiTags(
  path: string,
  props: Partial<Omit<TagsDecorator, 'type'>>,
): GuiTagsShortcut;
export function _guiTags(
  path: string,
  props: Partial<Omit<TagsDecorator, 'type'>>,
  tags: string[],
): GuiTagsShortcut;
export function _guiTags(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<TagsDecorator, 'type'>>,
  tags?: string[],
): GuiTagsShortcut;
export function _guiTags(
  path: string,
  propsOrCallback?:
    | Partial<Omit<TagsDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<TagsDecorator, 'type'>>),
  tags?: string[],
): GuiTagsShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'tags' as const, ...callback(params) });
    const items: TagsEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'TAGS', items, tags: tags ?? [] };
  }

  const def: TagsDecorator = { type: 'tags', ...propsOrCallback };
  const items: TagsEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'TAGS', items, tags: tags ?? [] };
}
