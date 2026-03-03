import { GslLeafSelector } from '../../core/dx.domain';
import { InputDecorator, GslInputsConfig } from './inputs.domain';

export function _gslInputs(
  config: GslInputsConfig,
  matcher: (decorator: InputDecorator) => boolean = () => true,
): GslLeafSelector {
  return {
    kind: 'leaf',
    selectorType: 'INPUTS',
    matcher,
    config,
  };
}
