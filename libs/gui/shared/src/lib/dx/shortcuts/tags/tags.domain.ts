import type { ArrayValidator } from '@golemui/gui-validators';
import type { TagsProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';
import type { DxValidator } from '../../core/dxValidatorHelper';

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
