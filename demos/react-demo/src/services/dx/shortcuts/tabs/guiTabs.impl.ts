import { GuiItemTypes, ValidGuiShortcut } from '../../core/dx.domain';
import type { GuiTabsShortcut, TabsDecorator } from './tabs.domain';

type TabsFactoryProps = Omit<TabsDecorator, 'tabs'>;

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function _guiTabs(
  tabs: Record<string, ValidGuiShortcut[]>,
): GuiTabsShortcut;
export function _guiTabs(
  tabs: Record<string, ValidGuiShortcut[]>,
  props: TabsFactoryProps,
): GuiTabsShortcut;
export function _guiTabs(
  tabs: Record<string, ValidGuiShortcut[]>,
  props: TabsFactoryProps,
  tags: string[],
): GuiTabsShortcut;
export function _guiTabs(
  tabsRecord: Record<string, ValidGuiShortcut[]>,
  props?: TabsFactoryProps,
  tags?: string[],
): GuiTabsShortcut {
  const tabHeaders = Object.keys(tabsRecord).map((label) => ({
    label,
    uid: slugify(label),
  }));

  const children: ValidGuiShortcut[] = Object.entries(tabsRecord).map(([label, content]) => ({
    type: 'ITEMS',
    itemType: GuiItemTypes.LAYOUTS,
    items: [
      {
        def: { uid: slugify(label), direction: 'vertical', widgetName: 'flex' },
        children: content,
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
