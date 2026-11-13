import { type DxRuntimeParams } from '@golemui/dx';
import type { GuiRatingShortcut, RatingDecorator, RatingEntry } from './rating.domain';

type RatingFactoryProps = Omit<RatingDecorator, 'type'>;

export function _guiRating(path: string): GuiRatingShortcut;
export function _guiRating(path: string, props: RatingFactoryProps): GuiRatingShortcut;
export function _guiRating(
  path: string,
  props: RatingFactoryProps,
  tags: string[],
): GuiRatingShortcut;
export function _guiRating(
  path: string,
  callback: (params: DxRuntimeParams) => RatingFactoryProps,
  tags?: string[],
): GuiRatingShortcut;
export function _guiRating(
  path: string,
  propsOrCallback?: RatingFactoryProps | ((params: DxRuntimeParams) => RatingFactoryProps),
  tags?: string[],
): GuiRatingShortcut {
  if (typeof propsOrCallback === 'function') {
    const callback = propsOrCallback;
    const def = (params: DxRuntimeParams) => ({ type: 'rating' as const, ...callback(params) });
    const items: RatingEntry[] = [{ key: path, def }];
    return { type: 'ITEMS', itemType: 'RATING', items, tags: tags ?? [] };
  }

  const def: RatingDecorator = { type: 'rating', ...propsOrCallback };
  const items: RatingEntry[] = [{ key: path, def }];
  return { type: 'ITEMS', itemType: 'RATING', items, tags: tags ?? [] };
}
