import { GslLeafSelector } from '../../core/dx.domain';

/**
 * GSL-level state targeting selector.
 *
 * Wraps leaf selectors and marks them as targeting a specific state name.
 * When resolved, matching configs are applied as state-suffixed overrides
 * rather than base property overrides.
 *
 * Usage:
 * ```ts
 * _gslRoot(
 *   _gslStates('limitReached',
 *     _gslInputs({ disabled: true }),
 *     _gslLayouts({ direction: 'column' }),
 *   ),
 *   _gslInputs({ label: 'uppercase' }),
 * )
 * ```
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
