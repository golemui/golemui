import { dxCatalog, resolveDxFramework } from '../dx/dx-specs';
import type { DxCatalog, DxFramework } from '../dx/dx-specs';

export type ListDxFactoriesResult = DxCatalog;

/**
 * Return the entire `gui.*` DX surface in one payload: every factory name + one-line
 * signature, the cross-cutting pattern names, and the common note. The catalog the agent
 * fetches ONCE before authoring, instead of paying a `get_dx_spec` round-trip per factory.
 *
 * The common note's imports + render snippet are tailored to `framework` (defaults to the
 * `GOLEMUI_FRAMEWORK` env, else react) so the agent is shown the correct host wiring.
 */
export function listDxFactoriesCatalog(
  framework: DxFramework = resolveDxFramework(),
): ListDxFactoriesResult {
  return dxCatalog(framework);
}

export const LIST_DX_FACTORIES_TOOL = {
  name: 'list_dx_factories',
  description:
    'The complete GolemUI `gui.*` DX reference in ONE call: EVERY factory with its namespace, calling ' +
    'convention, a compile-verified example, and its gotchas — plus the cross-cutting patterns (e.g. ' +
    'conditional visibility) and the common authoring rules (incl. the validator `type` rule). **Call ' +
    'this FIRST when authoring `gui.*` DX code, then write from it directly** — it is self-sufficient for ' +
    'most forms, so you rarely need a follow-up lookup. GolemUI is not in any model\'s training data, so ' +
    'do NOT guess the API; every real name is here. `get_dx_spec(factory)` is only the rare deep-dive for ' +
    'one factory. You do NOT need `get_widget_spec` when writing `gui.*` code — that serves the JSON ' +
    'form-definition surface, a different API. Takes no arguments; fetch once and keep it in context.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
} as const;
