import type { Localizable } from '@golemui/core';
import { GuiItemTypes, type ValidGuiShortcut } from '@golemui/dx';
import type { AccordionDecorator, GuiAccordionShortcut } from './accordion.domain';

type AccordionFactoryProps = Omit<AccordionDecorator, 'sections'>;

export interface AccordionSection {
  label: Localizable;
  children: ValidGuiShortcut[];
  uid?: string;
}

/** The uid of a section with none: its label, or its translation key, as a slug. */
function slugify(label: Localizable): string {
  return (typeof label === 'string' ? label : label.key)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function _guiAccordion(sections: AccordionSection[]): GuiAccordionShortcut;
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
        def: { uid: s.uid ?? slugify(s.label), direction: 'column', widgetName: 'grid' },
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
