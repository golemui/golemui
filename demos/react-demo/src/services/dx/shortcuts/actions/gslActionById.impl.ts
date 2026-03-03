import { GslLeafSelector } from '../../core/dx.domain';
import { GslActionsConfig } from './actions.domain';

export function _gslActionById(id: string, config: GslActionsConfig): GslLeafSelector {
  return {
    kind: 'leaf',
    selectorType: 'ACTIONS',
    matcher: (d) => d.uid === id,
    config,
  };
}
