import { type DxRuntimeParams } from '../../core/dxUtilityTypes';
import type {
  GuiRangeTimeInputShortcut,
  RangeTimeInputDecorator,
  RangeTimeInputEntry,
} from './rangeTimeInput.domain';

export function _guiRangeTimeInput(path: string): GuiRangeTimeInputShortcut;
export function _guiRangeTimeInput(
  path: string,
  props: Partial<Omit<RangeTimeInputDecorator, 'type'>>,
): GuiRangeTimeInputShortcut;
export function _guiRangeTimeInput(
  path: string,
  props: Partial<Omit<RangeTimeInputDecorator, 'type'>>,
  tags: string[],
): GuiRangeTimeInputShortcut;
export function _guiRangeTimeInput(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<RangeTimeInputDecorator, 'type'>>,
  tags?: string[],
): GuiRangeTimeInputShortcut;
export function _guiRangeTimeInput(
  path: string,
  propsOrCallback?:
    | Partial<Omit<RangeTimeInputDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<RangeTimeInputDecorator, 'type'>>),
  tags?: string[],
): GuiRangeTimeInputShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'rangeTimeInput' as const,
      ...callback(params),
    });
    const items: RangeTimeInputEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'RANGE_TIME_INPUT', items, tags: tags ?? [] };
  }

  const def: RangeTimeInputDecorator = { type: 'rangeTimeInput', ...propsOrCallback };
  const items: RangeTimeInputEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'RANGE_TIME_INPUT', items, tags: tags ?? [] };
}
