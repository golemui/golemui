import { ValidGuiShortcut, GuiItemTypes } from '../../core/dx.domain';
import { GuiLayoutItemsShortcut } from './layouts.domain';
import type { FlexProps } from '../../../widget.props';

export const _guiStack = (
  direction: FlexProps['direction'],
  children: ValidGuiShortcut[],
  tags?: string[],
): GuiLayoutItemsShortcut => {
  return {
    type: 'ITEMS',
    itemType: GuiItemTypes.LAYOUTS,
    items: [{ def: { widgetName: 'flex', direction }, children }],
    tags: tags ?? [],
  };
};

export const _guiHorizontalStack = (
  children: ValidGuiShortcut[] | ValidGuiShortcut,
  tags?: string[],
): GuiLayoutItemsShortcut => {
  return _guiStack('row', Array.isArray(children) ? children : (children ? [children] : []), tags);
};

export const _guiVerticalStack = (
  children: ValidGuiShortcut[],
  tags?: string[],
): GuiLayoutItemsShortcut => {
  return _guiStack('column', children, tags);
};
