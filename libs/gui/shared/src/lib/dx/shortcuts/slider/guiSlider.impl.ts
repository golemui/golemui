import { type DxRuntimeParams } from '@golemui/dx';
import type { GuiSliderShortcut, SliderDecorator, SliderEntry } from './slider.domain';

export function _guiSlider(path: string): GuiSliderShortcut;
export function _guiSlider(
  path: string,
  props: Partial<Omit<SliderDecorator, 'type'>>,
): GuiSliderShortcut;
export function _guiSlider(
  path: string,
  props: Partial<Omit<SliderDecorator, 'type'>>,
  tags: string[],
): GuiSliderShortcut;
export function _guiSlider(
  path: string,
  callback: (params: DxRuntimeParams) => Partial<Omit<SliderDecorator, 'type'>>,
  tags?: string[],
): GuiSliderShortcut;
export function _guiSlider(
  path: string,
  propsOrCallback?:
    | Partial<Omit<SliderDecorator, 'type'>>
    | ((params: DxRuntimeParams) => Partial<Omit<SliderDecorator, 'type'>>),
  tags?: string[],
): GuiSliderShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({
      type: 'slider' as const,
      ...callback(params),
    });
    const items: SliderEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'SLIDER', items, tags: tags ?? [] };
  }

  const def: SliderDecorator = { type: 'slider', ...propsOrCallback };
  const items: SliderEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'SLIDER', items, tags: tags ?? [] };
}
