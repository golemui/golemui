import { GslLeafSelector } from '../../core/dx.domain';

/**
 * Internal underscore-era state-targeting primitive. Pending focus-closeout
 * removal — the spec entrance is `gui.selectors.state(name).<typeSelector>(config)`.
 *
 * Wraps leaf selectors and marks them as targeting a specific state name.
 * When resolved, matching configs are applied as state-suffixed overrides
 * rather than base property overrides. Returns an array of leaves; spread
 * into the `formSelectors` array since `_gslRoot` is gone.
 */
export function _gslStates(
  stateName: string,
  ...children: GslLeafSelector[]
): GslLeafSelector[] {
  return children.map(child => ({
    ...child,
    targetState: stateName,
  }));
}
