import { GuiItemTypes, ValidGuiShortcut } from '../../core/dx.domain';
import type { AccordionDecorator, GuiAccordionShortcut } from './accordion.domain';

type AccordionFactoryProps = Omit<AccordionDecorator, 'sections'>;

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function _guiAccordion(
  sections: Record<string, ValidGuiShortcut[]>,
): GuiAccordionShortcut;
export function _guiAccordion(
  sections: Record<string, ValidGuiShortcut[]>,
  props: AccordionFactoryProps,
): GuiAccordionShortcut;
export function _guiAccordion(
  sections: Record<string, ValidGuiShortcut[]>,
  props: AccordionFactoryProps,
  tags: string[],
): GuiAccordionShortcut;
export function _guiAccordion(
  sectionsRecord: Record<string, ValidGuiShortcut[]>,
  props?: AccordionFactoryProps,
  tags?: string[],
): GuiAccordionShortcut {
  const sectionHeaders = Object.keys(sectionsRecord).map((label) => ({
    label,
    uid: slugify(label),
  }));

  const children: ValidGuiShortcut[] = Object.entries(sectionsRecord).map(([label, content]) => ({
    type: 'ITEMS',
    itemType: GuiItemTypes.LAYOUTS,
    items: [
      {
        def: { uid: slugify(label), direction: 'column', widgetName: 'flex' },
        children: content,
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
