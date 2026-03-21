import {
  GslAggregatedSelector,
  GslLeafSelector,
} from '../../core/dx.domain';

type GslRootChild = GslLeafSelector | GslLeafSelector[];

export function _gslRoot(
  ...children: GslRootChild[]
): GslAggregatedSelector {
  return {
    kind: 'aggregated',
    matcher: () => true,
    children: children.flat(),
  };
}
