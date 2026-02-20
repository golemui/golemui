import { GslIdSelector, GslIdSelectorType } from '../../core/dx.domain';
import { GslLayoutByIdConfig } from './layouts.domain';

export function _gslLayoutById(id: string, config: GslLayoutByIdConfig): GslIdSelector {
  return {
    kind: 'id',
    selectorType: GslIdSelectorType.LAYOUT,
    id,
    config,
  };
}
