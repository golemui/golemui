import { type DxRuntimeParams } from '@golemui/dx';
import type {
  GuiRangeDatePickerShortcut,
  RangeDatePickerDecorator,
  RangeDatePickerEntry,
} from './rangeDatePicker.domain';

export function _guiRangeDatePicker(path: string): GuiRangeDatePickerShortcut;
export function _guiRangeDatePicker(
  path: string,
  props: Partial<Omit<RangeDatePickerDecorator, 'type'>>,
): GuiRangeDatePickerShortcut;
export function _guiRangeDatePicker(
  path: string,
  props: Partial<Omit<RangeDatePickerDecorator, 'type'>>,
  tags: string[],
): GuiRangeDatePickerShortcut;
export function _guiRangeDatePicker(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<RangeDatePickerDecorator, 'type'>>,
  tags?: string[],
): GuiRangeDatePickerShortcut;
export function _guiRangeDatePicker(
  path: string,
  propsOrCallback?:
    | Partial<Omit<RangeDatePickerDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<RangeDatePickerDecorator, 'type'>>),
  tags?: string[],
): GuiRangeDatePickerShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'rangeDatePicker' as const,
      ...callback(params),
    });
    const items: RangeDatePickerEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'RANGE_DATE_PICKER', items, tags: tags ?? [] };
  }

  const def: RangeDatePickerDecorator = { type: 'rangeDatePicker', ...propsOrCallback };
  const items: RangeDatePickerEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'RANGE_DATE_PICKER', items, tags: tags ?? [] };
}
