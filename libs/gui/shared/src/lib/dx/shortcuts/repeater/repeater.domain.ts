import type { DxCommonFields } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';
import type { ValidGuiShortcut } from '../../core/dx.domain';

export interface RepeaterDecorator extends DxCommonFields {
  label?: string;
  addLabel?: string;
  removeLabel?: string;
  limit?: number;
  title?: string;
  addButtonIcon?: string;
  removeButtonIcon?: string;
}

export type GslRepeaterConfig = GslConfigBase<RepeaterDecorator>;

export type RepeaterEntry = {
  key: string;
  def: DefOrCallback<RepeaterDecorator>;
  children: ValidGuiShortcut[];
};

export type GuiRepeaterShortcut = GuiShortcutOf<'REPEATER', RepeaterEntry>;
