import type { DxRuntimeParams } from '@golemui/dx';
import type {
  CustomInputDecorator,
  CustomInputEntry,
  GuiCustomInputShortcut,
} from './customInput.domain';

type CustomInputFactoryProps = Omit<CustomInputDecorator, 'customType'>;

export function _guiCustomInput(
  type: string,
  path: string,
  props?: CustomInputFactoryProps,
  tags?: string[],
): GuiCustomInputShortcut;
export function _guiCustomInput(
  type: string,
  path: string,
  callback: (params: DxRuntimeParams) => CustomInputFactoryProps,
  tags?: string[],
): GuiCustomInputShortcut;
export function _guiCustomInput(
  type: string,
  path: string,
  propsOrCallback?:
    | CustomInputFactoryProps
    | ((params: DxRuntimeParams) => CustomInputFactoryProps),
  tags?: string[],
): GuiCustomInputShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      customType: type,
      ...callback(params),
    });
    const items: CustomInputEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'CUSTOM_INPUT', items, tags: tags ?? [] };
  }

  const def: CustomInputDecorator = { customType: type, ...propsOrCallback };
  const items: CustomInputEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'CUSTOM_INPUT', items, tags: tags ?? [] };
}
