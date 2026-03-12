import {
  GslAggregatedSelector,
  GslLeafSelector,
  GslRootDefaults,
} from '../../core/dx.domain';

function isGslLeafSelector(arg: GslLeafSelector | GslRootDefaults): arg is GslLeafSelector {
  return 'kind' in arg && arg.kind === 'leaf';
}

export function _gslRoot(
  ...args: [...GslLeafSelector[], GslRootDefaults] | GslLeafSelector[]
): GslAggregatedSelector {
  let children: GslLeafSelector[] = [];
  let rootDefaults: GslRootDefaults | undefined;

  if (args.length === 0) {
    return {
      kind: 'aggregated',
      matcher: () => true,
      children: [],
    };
  }

  const lastArg = args[args.length - 1];
  if (!isGslLeafSelector(lastArg)) {
    rootDefaults = lastArg as GslRootDefaults;
    children = args.slice(0, -1) as GslLeafSelector[];
  } else {
    children = args as GslLeafSelector[];
  }

  return {
    kind: 'aggregated',
    matcher: () => true,
    children,
    rootDefaults,
  };
}
