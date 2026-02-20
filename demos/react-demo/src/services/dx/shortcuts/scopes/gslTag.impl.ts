import { GslScopeSelector, GslScopeSelectorType, GslWidgetSelector } from '../../core/dx.domain';

export function _gslTag(tag: string, ...children: GslWidgetSelector[]): GslScopeSelector {
  return {
    kind: 'scope',
    scopeType: GslScopeSelectorType.TAG,
    tag,
    children,
  };
}
