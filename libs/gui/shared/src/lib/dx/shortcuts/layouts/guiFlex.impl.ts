import { ValidGuiShortcut, GuiItemTypes } from '../../core/dx.domain';
import { FlexFamilyProps, GridFamilyProps, GuiLayoutItemsShortcut } from './layouts.domain';

// ── Flex family — uniform (children, props?, tags?) ──

export const _guiFlex = (
  children: ValidGuiShortcut[],
  props?: FlexFamilyProps,
  tags?: string[],
): GuiLayoutItemsShortcut => ({
  type: 'ITEMS',
  itemType: GuiItemTypes.LAYOUTS,
  items: [{ def: { widgetName: 'flex', ...(props ?? {}) } as any, children }],
  tags: tags ?? [],
});

export const _guiHorizontalFlex = (
  children: ValidGuiShortcut[],
  props?: Omit<FlexFamilyProps, 'direction'>,
  tags?: string[],
): GuiLayoutItemsShortcut => _guiFlex(children, { direction: 'row', ...(props ?? {}) }, tags);

export const _guiVerticalFlex = (
  children: ValidGuiShortcut[],
  props?: Omit<FlexFamilyProps, 'direction'>,
  tags?: string[],
): GuiLayoutItemsShortcut => _guiFlex(children, { direction: 'column', ...(props ?? {}) }, tags);

// ── Grid family — uniform (children, props?, tags?) ──

export const _guiGrid = (
  children: ValidGuiShortcut[],
  props?: GridFamilyProps,
  tags?: string[],
): GuiLayoutItemsShortcut => ({
  type: 'ITEMS',
  itemType: GuiItemTypes.LAYOUTS,
  items: [
    {
      def: {
        widgetName: 'grid',
        direction: 'row',
        autoFit: true,
        ...(props ?? {}),
      } as any,
      children,
    },
  ],
  tags: tags ?? [],
});

export const _guiHorizontalGrid = (
  children: ValidGuiShortcut[],
  props?: Omit<GridFamilyProps, 'direction'>,
  tags?: string[],
): GuiLayoutItemsShortcut => _guiGrid(children, { direction: 'row', ...(props ?? {}) }, tags);

export const _guiVerticalGrid = (
  children: ValidGuiShortcut[],
  props?: Omit<GridFamilyProps, 'direction'>,
  tags?: string[],
): GuiLayoutItemsShortcut => _guiGrid(children, { direction: 'column', ...(props ?? {}) }, tags);
