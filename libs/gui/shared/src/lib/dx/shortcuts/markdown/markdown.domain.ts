import type { StringValidator } from '@golemui/gui-validators';
import type { MarkdownProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';
export interface MarkdownDecorator extends DxInputBase, DxCommonFields, Partial<MarkdownProps> {
  type: 'markdown';
  validator?: DxValidator<StringValidator>;
}

export interface GslMarkdownConfig extends GslConfigBase<MarkdownDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}
export type MarkdownEntry = { key: string; def: DefOrCallback<MarkdownDecorator> };
export type GuiMarkdownShortcut = GuiShortcutOf<'MARKDOWN', MarkdownEntry>;
