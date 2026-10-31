import type { ArrayValidator } from '@golemui/gui-validators';
import type { DxCommonFields } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { ValidGuiShortcut } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface RepeaterDecorator extends DxCommonFields {
  label?: string;
  addLabel?: string;
  removeLabel?: string;
  /**
   * @deprecated Use `validator.maxItems`, which shows an error past the cap instead of disabling
   * the add button without a message. It will be removed in v3.0.0.
   */
  limit?: number;
  title?: string;
  addButtonIcon?: string;
  removeButtonIcon?: string;
  validator?: DxValidator<ArrayValidator>;
}

export type GslRepeaterConfig = GslConfigBase<RepeaterDecorator>;

export type RepeaterEntry = {
  key: string;
  def: DefOrCallback<RepeaterDecorator>;
  children: ValidGuiShortcut[];
};

export type GuiRepeaterShortcut = GuiShortcutOf<'REPEATER', RepeaterEntry>;
