import { GslLayoutsLeafSelector } from '../../core/dx.domain';
import { GslLayoutsConfig } from './layouts.domain';

export function _gslLayoutById(id: string, config: GslLayoutsConfig): GslLayoutsLeafSelector {
  return {
    kind: 'leaf',
    selectorType: 'LAYOUTS',
    matcher: (d) => d.uid === id,
    config,
  };
}
