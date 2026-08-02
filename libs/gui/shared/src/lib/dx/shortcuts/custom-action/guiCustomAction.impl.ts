import type { DxRuntimeParams } from '@golemui/dx';
import type {
  CustomActionDecorator,
  CustomActionEntry,
  GuiCustomActionShortcut,
} from './customAction.domain';

type CustomActionFactoryProps = Omit<CustomActionDecorator, 'customType'>;

export function _guiCustomAction(
  type: string,
  props?: CustomActionFactoryProps,
  tags?: string[],
): GuiCustomActionShortcut;
export function _guiCustomAction(
  type: string,
  callback: (params: DxRuntimeParams) => CustomActionFactoryProps,
  tags?: string[],
): GuiCustomActionShortcut;
export function _guiCustomAction(
  type: string,
  propsOrCallback?:
    | CustomActionFactoryProps
    | ((params: DxRuntimeParams) => CustomActionFactoryProps),
  tags?: string[],
): GuiCustomActionShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const items: CustomActionEntry[] = [
      (params: DxRuntimeParams) => ({ customType: type, ...callback(params) }),
    ];
    return { type: 'ITEMS', itemType: 'CUSTOM_ACTION', items, tags: tags ?? [] };
  }

  const decorator: CustomActionDecorator = { customType: type, ...propsOrCallback };
  const items: CustomActionEntry[] = [decorator];
  return { type: 'ITEMS', itemType: 'CUSTOM_ACTION', items, tags: tags ?? [] };
}
