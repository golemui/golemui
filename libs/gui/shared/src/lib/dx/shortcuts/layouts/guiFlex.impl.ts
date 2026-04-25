import { ValidGuiShortcut, GuiItemTypes } from '../../core/dx.domain';
import { GuiLayoutItemsShortcut, LayoutDecorator } from './layouts.domain';
import type { GridProps } from '../../../widget.props';

// Props slot accepts the full LayoutDecorator shape (FlexProps already mixed in
// via `LayoutDecorator extends Partial<FlexProps>`) so demos can pass
// per-widget state overrides, when, size, uid, etc., alongside layout-specific
// flex/grid props.
type LayoutPropsBase = Omit<LayoutDecorator, 'widgetName'>;
type FlexPropsAll = LayoutPropsBase;
type GridPropsAll = LayoutPropsBase & Partial<GridProps>;

// ── Flex family — uniform (children, props?, tags?) ──

export const _guiFlex = (
  children: ValidGuiShortcut[],
  props?: FlexPropsAll,
  tags?: string[],
): GuiLayoutItemsShortcut => ({
  type: 'ITEMS',
  itemType: GuiItemTypes.LAYOUTS,
  items: [{ def: { widgetName: 'flex', ...(props ?? {}) } as any, children }],
  tags: tags ?? [],
});

export const _guiHorizontalFlex = (
  children: ValidGuiShortcut[],
  props?: Omit<FlexPropsAll, 'direction'>,
  tags?: string[],
): GuiLayoutItemsShortcut =>
  _guiFlex(children, { direction: 'row', ...(props ?? {}) }, tags);

export const _guiVerticalFlex = (
  children: ValidGuiShortcut[],
  props?: Omit<FlexPropsAll, 'direction'>,
  tags?: string[],
): GuiLayoutItemsShortcut =>
  _guiFlex(children, { direction: 'column', ...(props ?? {}) }, tags);

// ── Grid family — uniform (children, props?, tags?) ──

export const _guiGrid = (
  children: ValidGuiShortcut[],
  props?: GridPropsAll,
  tags?: string[],
): GuiLayoutItemsShortcut => ({
  type: 'ITEMS',
  itemType: GuiItemTypes.LAYOUTS,
  items: [{ def: { widgetName: 'grid', ...(props ?? {}) } as any, children }],
  tags: tags ?? [],
});

export const _guiHorizontalGrid = (
  children: ValidGuiShortcut[],
  props?: Omit<GridPropsAll, 'direction'>,
  tags?: string[],
): GuiLayoutItemsShortcut =>
  _guiGrid(children, { direction: 'row', ...(props ?? {}) }, tags);

export const _guiVerticalGrid = (
  children: ValidGuiShortcut[],
  props?: Omit<GridPropsAll, 'direction'>,
  tags?: string[],
): GuiLayoutItemsShortcut =>
  _guiGrid(children, { direction: 'column', ...(props ?? {}) }, tags);
