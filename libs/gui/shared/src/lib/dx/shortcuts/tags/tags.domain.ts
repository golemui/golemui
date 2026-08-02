import type { ArrayValidator } from '@golemui/gui-validators';
import type { TagsProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface TagsDecorator extends DxInputBase, DxCommonFields, Partial<TagsProps> {
  type: 'tags';
  validator?: DxValidator<ArrayValidator>;
}

export interface GslTagsConfig extends GslConfigBase<TagsDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

export type TagsEntry = { key: string; def: DefOrCallback<TagsDecorator> };
export type GuiTagsShortcut = GuiShortcutOf<'TAGS', TagsEntry>;
