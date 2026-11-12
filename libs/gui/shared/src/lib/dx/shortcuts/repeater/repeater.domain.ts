import type { ArrayValidator } from '@golemui/gui-validators';
import type { DxCommonFields, DxInputBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { ValidGuiShortcut } from '@golemui/dx';
import type { DxValidator } from '@golemui/dx';

export interface RepeaterDecorator extends DxCommonFields {
  label?: string;
  /**
   * Disables the add and remove buttons. It does not pass down to the widgets of the template:
   * give them their own `disabled`.
   */
  disabled?: DxInputBase['disabled'];
  /**
   * Hides the add and remove buttons. It does not pass down to the widgets of the template:
   * give them their own `readonly`.
   */
  readonly?: DxInputBase['readonly'];
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
