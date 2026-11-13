import type { NumberValidator } from '@golemui/gui-validators';
import type { RatingProps } from '../../../widget.props';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface RatingDecorator extends DxInputBase, DxCommonFields, Partial<RatingProps> {
  type: 'rating';
  /** An integer validator: its `maximum` is the number of stars (5 without one). */
  validator?: DxValidator<NumberValidator>;
}

export interface GslRatingConfig extends GslConfigBase<RatingDecorator> {
  suppressAutomaticLabels?: boolean;
}

export type RatingEntry = { key: string; def: DefOrCallback<RatingDecorator> };
export type GuiRatingShortcut = GuiShortcutOf<'RATING', RatingEntry>;
