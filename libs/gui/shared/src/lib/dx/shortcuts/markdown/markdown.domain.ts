import type { MarkdownProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';
export interface MarkdownDecorator extends DxInputBase, DxCommonFields, Partial<MarkdownProps> {
  type: 'markdown';
}

export interface GslMarkdownConfig extends GslConfigBase<MarkdownDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}
export type MarkdownEntry = { key: string; def: DefOrCallback<MarkdownDecorator> };
export type GuiMarkdownShortcut = GuiShortcutOf<'MARKDOWN', MarkdownEntry>;
