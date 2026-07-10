import type { DxRuntimeParams } from '../../core/dxUtilityTypes';
import type {
  DateTimePickerDecorator,
  DateTimePickerEntry,
  GuiDateTimePickerShortcut,
} from './dateTimePicker.domain';

type DateTimePickerFactoryProps = Omit<DateTimePickerDecorator, 'type'>;

export function _guiDateTimePicker(
  path: string,
  props: DateTimePickerFactoryProps,
): GuiDateTimePickerShortcut;
export function _guiDateTimePicker(
  path: string,
  props: DateTimePickerFactoryProps,
  tags: string[],
): GuiDateTimePickerShortcut;
export function _guiDateTimePicker(
  path: string,
  callback: (params: DxRuntimeParams) => DateTimePickerFactoryProps,
  tags?: string[],
): GuiDateTimePickerShortcut;
export function _guiDateTimePicker(
  path: string,
  propsOrCallback:
    | DateTimePickerFactoryProps
    | ((params: DxRuntimeParams) => DateTimePickerFactoryProps),
  tags?: string[],
): GuiDateTimePickerShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'dateTimePicker' as const,
      ...callback(params),
    });
    const items: DateTimePickerEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'DATE_TIME_PICKER', items, tags: tags ?? [] };
  }

  const def: DateTimePickerDecorator = { type: 'dateTimePicker', ...propsOrCallback };
  const items: DateTimePickerEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'DATE_TIME_PICKER', items, tags: tags ?? [] };
}
