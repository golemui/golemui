import { GslInputsConfig, GslWidgetSelector, GslWidgetSelectorType } from './gsl.domain';

export function _gslInputs(config: GslInputsConfig): GslWidgetSelector {
  return {
    kind: 'widget',
    selectorType: GslWidgetSelectorType.INPUTS,
    config,
  };
}
