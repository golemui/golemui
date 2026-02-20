import { GslWidgetSelector, GslWidgetSelectorType } from '../../core/dx.domain';
import { GslInputsConfig } from './inputs.domain';

export function _gslInputs(config: GslInputsConfig): GslWidgetSelector {
  return {
    kind: 'widget',
    selectorType: GslWidgetSelectorType.INPUTS,
    config,
  };
}
