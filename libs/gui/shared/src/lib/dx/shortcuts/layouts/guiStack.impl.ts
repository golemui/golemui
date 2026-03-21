import { ValidGuiShortcut, GuiItemTypes } from '../../core/dx.domain';
import { GuiLayoutItemsShortcut, LayoutDecorator } from './layouts.domain';
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

/** Config-object shape for _guiVerticalStack / _guiHorizontalStackConfig. */
interface StackConfig extends Omit<LayoutDecorator, 'widgetName'> {
  children: ValidGuiShortcut[];
}

/**
 * Creates a vertical (column) flex layout.
 *
 * Overload 1: simple — just children.
 * Overload 2: config object — supports direction override, states, when, size, etc.
 */
export function _guiVerticalStack(children: ValidGuiShortcut[], tags?: string[]): GuiLayoutItemsShortcut;
export function _guiVerticalStack(config: StackConfig, tags?: string[]): GuiLayoutItemsShortcut;
export function _guiVerticalStack(
  childrenOrConfig: ValidGuiShortcut[] | StackConfig,
  tags?: string[],
): GuiLayoutItemsShortcut {
  if (Array.isArray(childrenOrConfig)) {
    return _guiStack('column', childrenOrConfig, tags);
  }
  const { children, ...rest } = childrenOrConfig;
  return {
    type: 'ITEMS',
    itemType: GuiItemTypes.LAYOUTS,
    items: [{ def: { widgetName: 'flex', direction: 'column', ...rest }, children }],
    tags: tags ?? [],
  };
}
