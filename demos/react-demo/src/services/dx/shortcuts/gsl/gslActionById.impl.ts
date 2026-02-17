import { GslActionByIdConfig, GslIdSelector, GslIdSelectorType } from './gsl.domain';

export function _gslActionById(id: string, config: GslActionByIdConfig): GslIdSelector {
  return {
    kind: 'id',
    selectorType: GslIdSelectorType.ACTION,
    id,
    config,
  };
}
