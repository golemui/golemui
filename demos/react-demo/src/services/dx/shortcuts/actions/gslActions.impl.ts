import { GslWidgetSelector, GslWidgetSelectorType } from '../../core/dx.domain';
import { GslActionsConfig } from './actions.domain';

export function _gslActions(config: GslActionsConfig): GslWidgetSelector {
  return {
    kind: 'widget',
    selectorType: GslWidgetSelectorType.ACTIONS,
    config,
  };
}
