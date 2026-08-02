import type { ArrayValidator } from '@golemui/gui-validators';
import type { DxCommonFields } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { ValidGuiShortcut } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface RepeaterDecorator extends DxCommonFields {
  label?: string;
  addLabel?: string;
  removeLabel?: string;
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
