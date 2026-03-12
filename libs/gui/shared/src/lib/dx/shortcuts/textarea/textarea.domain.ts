import type { TextareaProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';
export interface TextareaDecorator extends DxInputBase, DxCommonFields, Partial<TextareaProps> {
  type: 'textarea';
}

export interface GslTextareaConfig extends GslConfigBase<TextareaDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}
export type TextareaEntry = { key: string; def: DefOrCallback<TextareaDecorator> };
export type GuiTextareaShortcut = GuiShortcutOf<'TEXTAREA', TextareaEntry>;
