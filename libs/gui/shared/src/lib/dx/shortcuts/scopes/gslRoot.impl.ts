import {
  GslAggregatedSelector,
  GslLeafSelector,
  FormConfig,
} from '../../core/dx.domain';

function isGslLeafSelector(arg: GslLeafSelector | FormConfig): arg is GslLeafSelector {
  return 'kind' in arg && arg.kind === 'leaf';
}

export function _gslRoot(
  ...args: [...GslLeafSelector[], FormConfig] | GslLeafSelector[]
): GslAggregatedSelector {
  let children: GslLeafSelector[] = [];
  let formConfig: FormConfig | undefined;

  if (args.length === 0) {
    return {
      kind: 'aggregated',
      matcher: () => true,
      children: [],
    };
  }

  const lastArg = args[args.length - 1];
  if (!isGslLeafSelector(lastArg)) {
    formConfig = lastArg as FormConfig;
    children = args.slice(0, -1) as GslLeafSelector[];
  } else {
    children = args as GslLeafSelector[];
  }

  return {
    kind: 'aggregated',
    matcher: () => true,
    children,
    formConfig,
  };
}
