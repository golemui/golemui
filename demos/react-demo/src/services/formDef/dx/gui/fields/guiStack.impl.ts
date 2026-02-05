import { GuiLayoutShortcut, GuiShortcutType, ValidGuiShortcut } from '../gui.domain';

export type StackOrientation = 'horizontal' | 'vertical';

export interface GuiStackShortcut extends GuiLayoutShortcut<{ orientation: StackOrientation }> {
  layoutRootProps: {
    widgetName: 'stack';
  };
}

export const _guiStack = (
  tupleOrString: [StackOrientation, ...string[]] | StackOrientation,
  children: ValidGuiShortcut[],
): GuiStackShortcut => {
  const tuple = typeof tupleOrString === 'string' ? [tupleOrString] : tupleOrString;
  const [orientation, ...tagsList] = tuple;

  return {
    type: GuiShortcutType.LAYOUT,
    layoutRootProps: { widgetName: 'stack' },
    layoutNestedProps: { orientation },
    tags: tagsList,
    children,
  };
};

export const _guiHorizontalStack = (children: ValidGuiShortcut[] | ValidGuiShortcut): GuiStackShortcut => {
  return _guiStack('horizontal', Array.isArray(children) ? children : (children ? [children] : []));
};

export const _guiVerticalStack = (children: ValidGuiShortcut[]): GuiStackShortcut => {
  return _guiStack('vertical', children);
};
