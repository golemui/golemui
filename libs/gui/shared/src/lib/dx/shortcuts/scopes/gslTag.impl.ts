import { type GslAggregatedSelector, type GslLeafSelector } from '@golemui/dx';

export function _gslTag(tag: string, ...children: GslLeafSelector[]): GslAggregatedSelector {
  return {
    kind: 'aggregated',
    matcher: (d) => d.tags?.includes(tag) ?? false,
    children,
  };
}
