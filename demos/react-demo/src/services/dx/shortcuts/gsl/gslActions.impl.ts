import { GslActionsConfig, GslWidgetSelector, GslWidgetSelectorType } from './gsl.domain';

export function _gslActions(config: GslActionsConfig): GslWidgetSelector {
  return {
    selectorType: GslWidgetSelectorType.ACTIONS,
    config,
  };
}
