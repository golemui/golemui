import { GslActionsLeafSelector } from '../../core/dx.domain';
import { ActionDecorator, GslActionsConfig } from './actions.domain';

export function _gslActions(
  config: GslActionsConfig,
  matcher: (decorator: ActionDecorator) => boolean = () => true,
): GslActionsLeafSelector {
  return {
    kind: 'leaf',
    selectorType: 'ACTIONS',
    matcher,
    config,
  };
}
