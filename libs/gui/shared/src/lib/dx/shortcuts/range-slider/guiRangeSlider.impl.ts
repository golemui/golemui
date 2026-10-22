import { type DxRuntimeParams } from '@golemui/dx';
import type {
  GuiRangeSliderShortcut,
  RangeSliderDecorator,
  RangeSliderEntry,
} from './range-slider.domain';

export function _guiRangeSlider(path: string): GuiRangeSliderShortcut;
export function _guiRangeSlider(
  path: string,
  props: Partial<Omit<RangeSliderDecorator, 'type'>>,
): GuiRangeSliderShortcut;
export function _guiRangeSlider(
  path: string,
  props: Partial<Omit<RangeSliderDecorator, 'type'>>,
  tags: string[],
): GuiRangeSliderShortcut;
export function _guiRangeSlider(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<RangeSliderDecorator, 'type'>>,
  tags?: string[],
): GuiRangeSliderShortcut;
export function _guiRangeSlider(
  path: string,
  propsOrCallback?:
    | Partial<Omit<RangeSliderDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<RangeSliderDecorator, 'type'>>),
  tags?: string[],
): GuiRangeSliderShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'rangeSlider' as const,
      ...callback(params),
    });
    const items: RangeSliderEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'RANGE_SLIDER', items, tags: tags ?? [] };
  }

  const def: RangeSliderDecorator = { type: 'rangeSlider', ...propsOrCallback };
  const items: RangeSliderEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'RANGE_SLIDER', items, tags: tags ?? [] };
}
