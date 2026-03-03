import { GslLeafSelector } from '../../core/dx.domain';
import { LayoutDecorator, GslLayoutsConfig } from './layouts.domain';

export function _gslLayouts(
  config: GslLayoutsConfig,
  matcher: (decorator: LayoutDecorator) => boolean = () => true,
): GslLeafSelector {
  return {
    kind: 'leaf',
    selectorType: 'LAYOUTS',
    matcher,
    config,
  };
}
