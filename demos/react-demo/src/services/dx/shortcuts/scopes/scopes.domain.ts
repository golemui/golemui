import { GslWidgetSelector } from '../../core/dx.domain';

// ═══════════════════════════════════════════════════
// Root Sensible Defaults
// ═══════════════════════════════════════════════════

export interface GslRootDefaults {
  suppressAutomaticStack?: boolean;
  suppressAutomaticSubmit?: boolean;
  onSubmit?: (data: any) => void;
}

// ═══════════════════════════════════════════════════
// Scope Selectors (produced by _gslRoot, _gslTag)
// ═══════════════════════════════════════════════════

export enum GslScopeSelectorType {
  ROOT = 'ROOT',
  TAG = 'TAG',
}

export interface GslScopeSelector {
  kind: 'scope';
  scopeType: GslScopeSelectorType;
  tag?: string;
  children: GslWidgetSelector[];
  rootDefaults?: GslRootDefaults;
}
