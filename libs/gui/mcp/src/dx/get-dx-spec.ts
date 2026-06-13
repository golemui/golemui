import { DX_SPECS, listDxFactories } from './dx-specs';
import type { DxSpec } from './dx-specs';

export type GetDxSpecInput = {
  /** The `gui.*` factory name, e.g. `textInput`, `dropdown`, `button`. */
  factory: string;
};

export type GetDxSpecResult = DxSpec;

/**
 * Return the real `gui.*` builder signature, a compile-verified example, and authoring notes
 * for a SINGLE factory — the deep-dive lookup. Lean by design: the cross-cutting common note
 * and patterns are NOT re-shipped here (they ride in `dx_list_factories`, fetched once), so a
 * follow-up lookup adds only the factory's own payload to the agent's context.
 */
export function getDxSpec(input: GetDxSpecInput): GetDxSpecResult {
  const spec = DX_SPECS[input?.factory];
  if (!spec) {
    throw new Error(
      `Unknown gui.* factory: ${JSON.stringify(input?.factory)}. Known factories: ${listDxFactories().join(', ')}.`,
    );
  }
  return { ...spec };
}

export const GET_DX_SPEC_TOOL = {
  name: 'dx_get_spec',
  description:
    'Deep-dive lookup for ONE `gui.*` factory — its calling convention, a compile-verified example, and ' +
    'authoring notes. **In most cases you do not need this: call `dx_list_factories` once and write from ' +
    "it** — it already carries every factory's example and gotchas plus the cross-cutting rules. Reach " +
    'here only when you want to re-confirm a single factory in isolation. Lean by design: it returns just ' +
    "that factory's payload (no repeated common note/patterns — those live in `dx_list_factories`). " +
    'Distinct from `json_get_widget_spec`, which returns the JSON form-definition shape. GolemUI is not in any ' +
    "model's training data, so do NOT guess the API. After writing, verify with `dx_check_code`. Pass " +
    '`factory` as the camelCase name (e.g. `textInput`, `dropdown`, `radiogroup`, `button`).',
  inputSchema: {
    type: 'object',
    properties: {
      factory: {
        type: 'string',
        description: 'The gui.* factory name, e.g. "textInput", "dropdown", "button".',
      },
    },
    required: ['factory'],
  },
} as const;
