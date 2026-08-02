import type { DxRuntimeParams } from '@golemui/dx';
import type {
  TimePickerDecorator,
  TimePickerEntry,
  GuiTimePickerShortcut,
} from './timePicker.domain';

type TimePickerFactoryProps = Omit<TimePickerDecorator, 'type'>;

export function _guiTimePicker(path: string, props: TimePickerFactoryProps): GuiTimePickerShortcut;
export function _guiTimePicker(
  path: string,
  props: TimePickerFactoryProps,
  tags: string[],
): GuiTimePickerShortcut;
export function _guiTimePicker(
  path: string,
  callback: (params: DxRuntimeParams) => TimePickerFactoryProps,
  tags?: string[],
): GuiTimePickerShortcut;
export function _guiTimePicker(
  path: string,
  propsOrCallback: TimePickerFactoryProps | ((params: DxRuntimeParams) => TimePickerFactoryProps),
  tags?: string[],
): GuiTimePickerShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'timePicker' as const,
      ...callback(params),
    });
    const items: TimePickerEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'TIME_PICKER', items, tags: tags ?? [] };
  }

  const def: TimePickerDecorator = { type: 'timePicker', ...propsOrCallback };
  const items: TimePickerEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'TIME_PICKER', items, tags: tags ?? [] };
}
