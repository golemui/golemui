import { type DxRuntimeParams } from '@golemui/dx';
import type {
  GuiRangeTimePickerShortcut,
  RangeTimePickerDecorator,
  RangeTimePickerEntry,
} from './rangeTimePicker.domain';

export function _guiRangeTimePicker(path: string): GuiRangeTimePickerShortcut;
export function _guiRangeTimePicker(
  path: string,
  props: Partial<Omit<RangeTimePickerDecorator, 'type'>>,
): GuiRangeTimePickerShortcut;
export function _guiRangeTimePicker(
  path: string,
  props: Partial<Omit<RangeTimePickerDecorator, 'type'>>,
  tags: string[],
): GuiRangeTimePickerShortcut;
export function _guiRangeTimePicker(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<RangeTimePickerDecorator, 'type'>>,
  tags?: string[],
): GuiRangeTimePickerShortcut;
export function _guiRangeTimePicker(
  path: string,
  propsOrCallback?:
    | Partial<Omit<RangeTimePickerDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<RangeTimePickerDecorator, 'type'>>),
  tags?: string[],
): GuiRangeTimePickerShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'rangeTimePicker' as const,
      ...callback(params),
    });
    const items: RangeTimePickerEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'RANGE_TIME_PICKER', items, tags: tags ?? [] };
  }

  const def: RangeTimePickerDecorator = { type: 'rangeTimePicker', ...propsOrCallback };
  const items: RangeTimePickerEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'RANGE_TIME_PICKER', items, tags: tags ?? [] };
}
