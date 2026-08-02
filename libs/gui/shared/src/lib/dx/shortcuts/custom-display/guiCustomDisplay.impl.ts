import type { DxRuntimeParams } from '@golemui/dx';
import type {
  CustomDisplayDecorator,
  CustomDisplayEntry,
  GuiCustomDisplayShortcut,
} from './customDisplay.domain';

type CustomDisplayFactoryProps = Omit<CustomDisplayDecorator, 'customType'>;

export function _guiCustomDisplay(
  type: string,
  props?: Record<string, unknown> & { uid?: string },
  tags?: string[],
): GuiCustomDisplayShortcut;
export function _guiCustomDisplay(
  type: string,
  callback: (params: DxRuntimeParams) => CustomDisplayFactoryProps,
  tags?: string[],
): GuiCustomDisplayShortcut;
export function _guiCustomDisplay(
  type: string,
  propsOrCallback?:
    | (Record<string, unknown> & { uid?: string })
    | ((params: DxRuntimeParams) => CustomDisplayFactoryProps),
  tags?: string[],
): GuiCustomDisplayShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const items: CustomDisplayEntry[] = [
      (params: DxRuntimeParams) => ({ customType: type, ...callback(params) }),
    ];
    return { type: 'ITEMS', itemType: 'CUSTOM_DISPLAY', items, tags: tags ?? [] };
  }

  const { uid, ...widgetProps } = propsOrCallback ?? {};
  const decorator: CustomDisplayDecorator = {
    customType: type,
    ...(uid != null ? { uid } : {}),
    props: Object.keys(widgetProps).length > 0 ? widgetProps : undefined,
  };
  const items: CustomDisplayEntry[] = [decorator];
  return { type: 'ITEMS', itemType: 'CUSTOM_DISPLAY', items, tags: tags ?? [] };
}
