import { DxRuntimeParams } from '../../core/dxUtilityTypes';
import type {
  GuiRadiogroupShortcut,
  RadiogroupDecorator,
  RadiogroupEntry,
} from './radiogroup.domain';

type RadiogroupFactoryProps = Omit<RadiogroupDecorator, 'type'>;

export function _guiRadiogroup(
  path: string,
  props: RadiogroupFactoryProps,
): GuiRadiogroupShortcut;
export function _guiRadiogroup(
  path: string,
  props: RadiogroupFactoryProps,
  tags: string[],
): GuiRadiogroupShortcut;
export function _guiRadiogroup(
  path: string,
  callback: (params: DxRuntimeParams) => RadiogroupFactoryProps,
  tags?: string[],
): GuiRadiogroupShortcut;
export function _guiRadiogroup(
  path: string,
  propsOrCallback:
    | RadiogroupFactoryProps
    | ((params: DxRuntimeParams) => RadiogroupFactoryProps),
  tags?: string[],
): GuiRadiogroupShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'radiogroup' as const, ...callback(params) });
    const items: RadiogroupEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'RADIOGROUP', items, tags: tags ?? [] };
  }

  const def: RadiogroupDecorator = { type: 'radiogroup', ...propsOrCallback };
  const items: RadiogroupEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'RADIOGROUP', items, tags: tags ?? [] };
}
