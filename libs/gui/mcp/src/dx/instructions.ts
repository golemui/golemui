import { resolveDxFramework } from './dx-specs';

/**
 * The `gui.*` DX half of the server's connect-time guidance (the MCP
 * `initialize.instructions` field). Composed with the JSON half in `cli.ts`. The target
 * framework name is interpolated from the environment at module load, the same as the
 * `list_dx_factories` catalog, so the agent is steered to the correct host wiring.
 */
export const DX_INSTRUCTIONS =
  'Writing GolemUI as DX code (the `gui.*` fluent builder in TypeScript) instead of a JSON ' +
  'definition? GolemUI is not in any model training data, so `gui.*` code is easy to fabricate — do ' +
  'NOT guess the API. FIRST call `list_dx_factories` once: it is the COMPLETE reference — every factory ' +
  'with its signature, a compile-verified example, and its gotchas, plus the cross-cutting patterns and ' +
  'common rules. Its imports + render snippet are tailored to your target framework (' +
  resolveDxFramework() +
  ') — use them verbatim; import `gui` ONLY from `@golemui/gui-shared`, never hand-write raw ' +
  '`{ kind, type, path }` widget JSON or cast to `any`. Keep it in context and write your whole form ' +
  'from it; it is self-sufficient for most ' +
  'forms. `get_dx_spec` is only a rare single-factory deep-dive — you usually will not need it, and you ' +
  'do NOT need `get_widget_spec` here (that is the JSON surface). Then ' +
  'ALWAYS finish by calling `check_dx_code` with the snippet — it type-checks against the real ' +
  '`@golemui` declarations and returns `{ ok, diagnostics }` (each with a fix `hint` for recognized ' +
  'mistakes). Treat `ok: false` as blocking: apply the fixes and re-check until `ok` is true. Use ' +
  '`check_dx_code` for `gui.*` *code* and `validate_form_definition` for a JSON *definition object* — ' +
  'they are not interchangeable.\n\n';
