import type { DxCommonFields, DxLayoutBase } from '../../core/dxBase.types';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '../../core/dxUtilityTypes';
import type { ValidGuiShortcut } from '../../core/dx.domain';

export interface AccordionDecorator extends DxLayoutBase, DxCommonFields {
  sections: { label: string; uid: string }[];
  singleOpen?: boolean;
  defaultOpen?: { [key: string]: boolean };
  renderMode?: 'all' | 'activeOnly';
}

export type GslAccordionConfig = GslConfigBase<AccordionDecorator>;

export type AccordionEntry = {
  def: DefOrCallback<AccordionDecorator>;
  children: ValidGuiShortcut[];
};

export type GuiAccordionShortcut = GuiShortcutOf<'ACCORDION', AccordionEntry>;
