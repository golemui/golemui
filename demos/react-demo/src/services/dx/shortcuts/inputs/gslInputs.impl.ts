import { GslInputsLeafSelector } from '../../core/dx.domain';
import { InputDecorator, GslInputsConfig } from './inputs.domain';

export function _gslInputs(
  config: GslInputsConfig,
  matcher: (decorator: InputDecorator) => boolean = () => true,
): GslInputsLeafSelector {
  return {
    kind: 'leaf',
    selectorType: 'INPUTS',
    matcher,
    config,
  };
}
