import { GuiItemTypes, ValidGuiShortcut } from '../../core/dx.domain';
import type { AccordionDecorator, GuiAccordionShortcut } from './accordion.domain';

type AccordionFactoryProps = Omit<AccordionDecorator, 'sections'>;

export interface AccordionSection {
  label: string;
  children: ValidGuiShortcut[];
  uid?: string;
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function _guiAccordion(
  sections: AccordionSection[],
): GuiAccordionShortcut;
export function _guiAccordion(
  sections: AccordionSection[],
  props: AccordionFactoryProps,
): GuiAccordionShortcut;
export function _guiAccordion(
  sections: AccordionSection[],
  props: AccordionFactoryProps,
  tags: string[],
): GuiAccordionShortcut;
export function _guiAccordion(
  sections: AccordionSection[],
  props?: AccordionFactoryProps,
  tags?: string[],
): GuiAccordionShortcut {
  const sectionHeaders = sections.map((s) => ({
    label: s.label,
    uid: s.uid ?? slugify(s.label),
  }));

  const children: ValidGuiShortcut[] = sections.map((s) => ({
    type: 'ITEMS',
    itemType: GuiItemTypes.LAYOUTS,
    items: [
      {
        def: { uid: s.uid ?? slugify(s.label), direction: 'column', widgetName: 'flex' },
        children: s.children,
      },
    ],
    tags: [],
  }));

  const def: AccordionDecorator = {
    sections: sectionHeaders,
    ...props,
  };

  return {
    type: 'ITEMS',
    itemType: 'ACCORDION',
    items: [{ def, children }],
    tags: tags ?? [],
  };
}
