import { GslIdSelector, GslIdSelectorType, GslLayoutByIdConfig } from './gsl.domain';

export function _gslLayoutById(id: string, config: GslLayoutByIdConfig): GslIdSelector {
  return {
    kind: 'id',
    selectorType: GslIdSelectorType.LAYOUT,
    id,
    config,
  };
}
