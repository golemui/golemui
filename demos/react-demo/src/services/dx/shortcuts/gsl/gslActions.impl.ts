import { GslActionsConfig, GslWidgetSelector, GslWidgetSelectorType } from './gsl.domain';

export function _gslActions(config: GslActionsConfig): GslWidgetSelector {
  return {
    kind: 'widget',
    selectorType: GslWidgetSelectorType.ACTIONS,
    config,
  };
}
