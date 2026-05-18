import type { StringValidator } from '@golemui/gui-validators';
import type { TextareaProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';
import type { DxValidator } from '../../core/dxValidatorHelper';
export interface TextareaDecorator extends DxInputBase, DxCommonFields, Partial<TextareaProps> {
  type: 'textarea';
  validator?: DxValidator<StringValidator>;
}

export interface GslTextareaConfig extends GslConfigBase<TextareaDecorator> {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}
export type TextareaEntry = { key: string; def: DefOrCallback<TextareaDecorator> };
export type GuiTextareaShortcut = GuiShortcutOf<'TEXTAREA', TextareaEntry>;
