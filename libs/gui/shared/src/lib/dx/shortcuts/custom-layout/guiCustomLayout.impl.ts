import type { ValidGuiShortcut } from '@golemui/dx';
import type { DxRuntimeParams } from '@golemui/dx';
import type {
  CustomLayoutDecorator,
  CustomLayoutEntry,
  GuiCustomLayoutShortcut,
} from './customLayout.domain';

type CustomLayoutFactoryProps = Omit<CustomLayoutDecorator, 'customType'>;

export function _guiCustomLayout(
  type: string,
  children: ValidGuiShortcut[],
  props?: CustomLayoutFactoryProps,
  tags?: string[],
): GuiCustomLayoutShortcut;
export function _guiCustomLayout(
  type: string,
  children: ValidGuiShortcut[],
  callback: (params: DxRuntimeParams) => CustomLayoutFactoryProps,
  tags?: string[],
): GuiCustomLayoutShortcut;
export function _guiCustomLayout(
  type: string,
  children: ValidGuiShortcut[],
  propsOrCallback?:
    | CustomLayoutFactoryProps
    | ((params: DxRuntimeParams) => CustomLayoutFactoryProps),
  tags?: string[],
): GuiCustomLayoutShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      customType: type,
      ...callback(params),
    });
    const items: CustomLayoutEntry[] = [{ def, children }];
    return { type: 'ITEMS', itemType: 'CUSTOM_LAYOUT', items, tags: tags ?? [] };
  }

  const def: CustomLayoutDecorator = { customType: type, ...propsOrCallback };
  const items: CustomLayoutEntry[] = [{ def, children }];
  return { type: 'ITEMS', itemType: 'CUSTOM_LAYOUT', items, tags: tags ?? [] };
}
