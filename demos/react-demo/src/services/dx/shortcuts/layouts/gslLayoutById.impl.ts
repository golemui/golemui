import { GslLeafSelector } from '../../core/dx.domain';
import { GslLayoutsConfig } from './layouts.domain';

export function _gslLayoutById(id: string, config: GslLayoutsConfig): GslLeafSelector {
  return {
    kind: 'leaf',
    selectorType: 'LAYOUTS',
    matcher: (d) => d.uid === id,
    config,
  };
}
