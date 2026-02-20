import { ValidGuiShortcut, GuiItemTypes } from '../../core/dx.domain';
import { GuiLayoutItemsShortcut } from './layouts.domain';

export type StackOrientation = 'horizontal' | 'vertical';

export const _guiStack = (
  tupleOrString: [StackOrientation, ...string[]] | StackOrientation,
  children: ValidGuiShortcut[],
): GuiLayoutItemsShortcut => {
  const tuple = typeof tupleOrString === 'string' ? [tupleOrString] : tupleOrString;
  const [orientation, ...tagsList] = tuple;

  return {
    type: 'ITEMS',
    itemType: GuiItemTypes.LAYOUTS,
    items: [{ def: { widgetName: 'flex', direction: orientation }, children }],
    tags: tagsList,
  };
};

export const _guiHorizontalStack = (children: ValidGuiShortcut[] | ValidGuiShortcut): GuiLayoutItemsShortcut => {
  return _guiStack('horizontal', Array.isArray(children) ? children : (children ? [children] : []));
};

export const _guiVerticalStack = (children: ValidGuiShortcut[]): GuiLayoutItemsShortcut => {
  return _guiStack('vertical', children);
};
