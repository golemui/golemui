import { GslScopeSelector, GslScopeSelectorType, GslWidgetSelector } from './gsl.domain';

export function _gslTag(tag: string, ...children: GslWidgetSelector[]): GslScopeSelector {
  return {
    kind: 'scope',
    scopeType: GslScopeSelectorType.TAG,
    tag,
    children,
  };
}
