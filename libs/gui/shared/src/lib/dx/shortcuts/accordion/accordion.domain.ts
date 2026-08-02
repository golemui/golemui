import type { DxCommonFields, DxLayoutBase } from '@golemui/dx';
import type { DefOrCallback, GslConfigBase, GuiShortcutOf } from '@golemui/dx';
import type { ValidGuiShortcut } from '@golemui/dx';

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
