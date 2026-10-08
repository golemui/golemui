import { type ValidGuiShortcut, GuiItemTypes } from '@golemui/dx';
import {
  type FlexFamilyProps,
  type GridFamilyProps,
  type GuiLayoutItemsShortcut,
} from './layouts.domain';

// ── Flex family — uniform (children, props?, tags?) ──

/** @deprecated Use `gui.layouts.grid`, which stacks its children; a flex layout renders as one. */
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

/** @deprecated Use `gui.layouts.horizontalGrid`; a flex layout renders as a grid. */
export const _guiHorizontalFlex = (
  children: ValidGuiShortcut[],
  props?: Omit<FlexFamilyProps, 'direction'>,
  tags?: string[],
): GuiLayoutItemsShortcut => _guiFlex(children, { direction: 'row', ...(props ?? {}) }, tags);

/** @deprecated Use `gui.layouts.grid` or `gui.layouts.verticalGrid`; a flex layout renders as a grid. */
export const _guiVerticalFlex = (
  children: ValidGuiShortcut[],
  props?: Omit<FlexFamilyProps, 'direction'>,
  tags?: string[],
): GuiLayoutItemsShortcut => _guiFlex(children, { direction: 'column', ...(props ?? {}) }, tags);

// ── Grid family — uniform (children, props?, tags?) ──

/** A grid: a stack by default, a row with `direction: 'row'`, or columns with `columns`. */
export const _guiGrid = (
  children: ValidGuiShortcut[],
  props?: GridFamilyProps,
  tags?: string[],
): GuiLayoutItemsShortcut => ({
  type: 'ITEMS',
  itemType: GuiItemTypes.LAYOUTS,
  items: [
    {
      def: { widgetName: 'grid', ...(props ?? {}) } as any,
      children,
    },
  ],
  tags: tags ?? [],
});

/** A grid row: the children share its width by `size`. */
export const _guiHorizontalGrid = (
  children: ValidGuiShortcut[],
  props?: Omit<GridFamilyProps, 'direction'>,
  tags?: string[],
): GuiLayoutItemsShortcut => _guiGrid(children, { direction: 'row', ...(props ?? {}) }, tags);

/** A grid stack, as `gui.layouts.grid` with no direction. */
export const _guiVerticalGrid = (
  children: ValidGuiShortcut[],
  props?: Omit<GridFamilyProps, 'direction'>,
  tags?: string[],
): GuiLayoutItemsShortcut => _guiGrid(children, { direction: 'column', ...(props ?? {}) }, tags);
