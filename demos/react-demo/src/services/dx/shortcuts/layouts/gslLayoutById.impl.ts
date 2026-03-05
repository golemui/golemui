import { createGslSelector } from '../../core/dxUtilityTypes';
import type { LayoutDecorator, GslLayoutsConfig } from './layouts.domain';

const createByIdSelector = createGslSelector<LayoutDecorator, GslLayoutsConfig>('LAYOUTS');

export function _gslLayoutById(id: string, config: GslLayoutsConfig) {
  return createByIdSelector(config, (d) => d.uid === id);
}
