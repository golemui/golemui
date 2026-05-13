import type { DxRuntimeParams } from '../../core/dxUtilityTypes';
import type {
  DatePickerDecorator,
  DatePickerEntry,
  GuiDatePickerShortcut,
} from './datePicker.domain';

type DatePickerFactoryProps = Omit<DatePickerDecorator, 'type'>;

export function _guiDatePicker(path: string, props: DatePickerFactoryProps): GuiDatePickerShortcut;
export function _guiDatePicker(
  path: string,
  props: DatePickerFactoryProps,
  tags: string[],
): GuiDatePickerShortcut;
export function _guiDatePicker(
  path: string,
  callback: (params: DxRuntimeParams) => DatePickerFactoryProps,
  tags?: string[],
): GuiDatePickerShortcut;
export function _guiDatePicker(
  path: string,
  propsOrCallback: DatePickerFactoryProps | ((params: DxRuntimeParams) => DatePickerFactoryProps),
  tags?: string[],
): GuiDatePickerShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'datePicker' as const,
      ...callback(params),
    });
    const items: DatePickerEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'DATE_PICKER', items, tags: tags ?? [] };
  }

  const def: DatePickerDecorator = { type: 'datePicker', ...propsOrCallback };
  const items: DatePickerEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'DATE_PICKER', items, tags: tags ?? [] };
}
