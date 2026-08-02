import { type DxRuntimeParams } from '@golemui/dx';
import type {
  GuiRangeDateInputShortcut,
  RangeDateInputDecorator,
  RangeDateInputEntry,
} from './rangeDateInput.domain';

export function _guiRangeDateInput(path: string): GuiRangeDateInputShortcut;
export function _guiRangeDateInput(
  path: string,
  props: Partial<Omit<RangeDateInputDecorator, 'type'>>,
): GuiRangeDateInputShortcut;
export function _guiRangeDateInput(
  path: string,
  props: Partial<Omit<RangeDateInputDecorator, 'type'>>,
  tags: string[],
): GuiRangeDateInputShortcut;
export function _guiRangeDateInput(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<RangeDateInputDecorator, 'type'>>,
  tags?: string[],
): GuiRangeDateInputShortcut;
export function _guiRangeDateInput(
  path: string,
  propsOrCallback?:
    | Partial<Omit<RangeDateInputDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<RangeDateInputDecorator, 'type'>>),
  tags?: string[],
): GuiRangeDateInputShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'rangeDateInput' as const,
      ...callback(params),
    });
    const items: RangeDateInputEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'RANGE_DATE_INPUT', items, tags: tags ?? [] };
  }

  const def: RangeDateInputDecorator = { type: 'rangeDateInput', ...propsOrCallback };
  const items: RangeDateInputEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'RANGE_DATE_INPUT', items, tags: tags ?? [] };
}
