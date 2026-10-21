import type { Localizable } from '@golemui/core';
import { GuiItemTypes, type ValidGuiShortcut } from '@golemui/dx';
import type { GuiTabsShortcut, TabsDecorator } from './tabs.domain';

type TabsFactoryProps = Omit<TabsDecorator, 'tabs'>;

export interface TabSection {
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

export function _guiTabs(sections: TabSection[]): GuiTabsShortcut;
export function _guiTabs(sections: TabSection[], props: TabsFactoryProps): GuiTabsShortcut;
export function _guiTabs(
  sections: TabSection[],
  props: TabsFactoryProps,
  tags: string[],
): GuiTabsShortcut;
export function _guiTabs(
  sections: TabSection[],
  props?: TabsFactoryProps,
  tags?: string[],
): GuiTabsShortcut {
  const tabHeaders = sections.map((s) => ({
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

  const def: TabsDecorator = {
    tabs: tabHeaders,
    ...props,
  };

  return {
    type: 'ITEMS',
    itemType: 'TABS',
    items: [{ def, children }],
    tags: tags ?? [],
  };
}
