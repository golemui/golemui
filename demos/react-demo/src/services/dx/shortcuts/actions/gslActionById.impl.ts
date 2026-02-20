import { GslIdSelector, GslIdSelectorType } from '../../core/dx.domain';
import { GslActionByIdConfig } from './actions.domain';

export function _gslActionById(id: string, config: GslActionByIdConfig): GslIdSelector {
  return {
    kind: 'id',
    selectorType: GslIdSelectorType.ACTION,
    id,
    config,
  };
}
