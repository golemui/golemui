import { GslDisplaysLeafSelector } from '../../core/dx.domain';
import { DisplayDecorator, GslDisplaysConfig } from './display.domain';

export function _gslDisplays(
  config: GslDisplaysConfig,
  matcher: (decorator: DisplayDecorator) => boolean = () => true,
): GslDisplaysLeafSelector {
  return {
    kind: 'leaf',
    selectorType: 'DISPLAYS',
    matcher,
    config,
  };
}
