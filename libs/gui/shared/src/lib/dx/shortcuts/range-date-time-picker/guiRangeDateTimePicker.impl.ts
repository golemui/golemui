import { type DxRuntimeParams } from '@golemui/dx';
import type {
  GuiRangeDateTimePickerShortcut,
  RangeDateTimePickerDecorator,
  RangeDateTimePickerEntry,
} from './rangeDateTimePicker.domain';

export function _guiRangeDateTimePicker(path: string): GuiRangeDateTimePickerShortcut;
export function _guiRangeDateTimePicker(
  path: string,
  props: Partial<Omit<RangeDateTimePickerDecorator, 'type'>>,
): GuiRangeDateTimePickerShortcut;
export function _guiRangeDateTimePicker(
  path: string,
  props: Partial<Omit<RangeDateTimePickerDecorator, 'type'>>,
  tags: string[],
): GuiRangeDateTimePickerShortcut;
export function _guiRangeDateTimePicker(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<RangeDateTimePickerDecorator, 'type'>>,
  tags?: string[],
): GuiRangeDateTimePickerShortcut;
export function _guiRangeDateTimePicker(
  path: string,
  propsOrCallback?:
    | Partial<Omit<RangeDateTimePickerDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<RangeDateTimePickerDecorator, 'type'>>),
  tags?: string[],
): GuiRangeDateTimePickerShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'rangeDateTimePicker' as const,
      ...callback(params),
    });
    const items: RangeDateTimePickerEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'RANGE_DATE_TIME_PICKER', items, tags: tags ?? [] };
  }

  const def: RangeDateTimePickerDecorator = { type: 'rangeDateTimePicker', ...propsOrCallback };
  const items: RangeDateTimePickerEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'RANGE_DATE_TIME_PICKER', items, tags: tags ?? [] };
}
