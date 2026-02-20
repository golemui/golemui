import {
  GslRootDefaults,
  GslScopeSelector,
  GslScopeSelectorType,
  GslWidgetSelector,
} from '../../core/dx.domain';

function isGslWidgetSelector(arg: GslWidgetSelector | GslRootDefaults): arg is GslWidgetSelector {
  return 'selectorType' in arg;
}

export function _gslRoot(
  ...args: [...GslWidgetSelector[], GslRootDefaults] | GslWidgetSelector[]
): GslScopeSelector {
  let children: GslWidgetSelector[] = [];
  let rootDefaults: GslRootDefaults | undefined;

  if (args.length === 0) {
    return {
      kind: 'scope',
      scopeType: GslScopeSelectorType.ROOT,
      children: [],
    };
  }

  const lastArg = args[args.length - 1];
  if (!isGslWidgetSelector(lastArg)) {
    rootDefaults = lastArg as GslRootDefaults;
    children = args.slice(0, -1) as GslWidgetSelector[];
  } else {
    children = args as GslWidgetSelector[];
  }

  return {
    kind: 'scope',
    scopeType: GslScopeSelectorType.ROOT,
    children,
    rootDefaults,
  };
}
