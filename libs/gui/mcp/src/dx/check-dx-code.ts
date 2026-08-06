import { typeCheckDx } from './typecheck';
import type { DxCheckResult } from './typecheck';

export type CheckDxCodeInput = {
  /** A `gui.*` DX snippet (TypeScript). May be a bare array of `gui.inputs.*` items. */
  code: string;
};

export type CheckDxCodeResult = DxCheckResult;

/**
 * Type-check GolemUI DX code against the real `@golemui` declarations and return
 * compiler diagnostics. Async because the TypeScript compiler is loaded lazily.
 */
export async function checkDxCode(input: CheckDxCodeInput): Promise<CheckDxCodeResult> {
  if (typeof input?.code !== 'string' || input.code.trim() === '') {
    throw new Error('dx_check_code requires a non-empty `code` string.');
  }
  return typeCheckDx(input.code);
}

export const DX_CHECK_CODE_TOOL = {
  name: 'dx_check_code',
  description:
    'Type-check GolemUI **DX code** (the `gui.*` fluent builder, written in TypeScript) against the ' +
    'real `@golemui` type declarations, and return compiler diagnostics. This is for `gui.*` *code* — ' +
    'distinct from `json_validate_form_definition`, which validates a JSON form-definition *object*. ' +
    "GolemUI is not in any model's training data, so generated `gui.*` code is frequently a confident " +
    'fabrication that does not compile; this is the only trustworthy check (inspection misses it). ' +
    'Beyond type errors it also catches defects the compiler cannot see: a misplaced ' +
    '`include`/`exclude` attached as a sibling of a `gui.*` spread (`{ ...gui.inputs.x(...), include }` ' +
    'compiles but silently never hides the field — put `include`/`exclude` INSIDE the config argument), ' +
    'reactive-expression mistakes in `when` strings, and the mandatory-checkbox trap (a ' +
    '`checkbox`/`booleanInput` validator with only half of the `required: true` + `const: true` pair — ' +
    'it will not force the box to be checked). Both lints share their rule engines with ' +
    '`json_validate_form_definition`. Pass the `gui.*` snippet as `code` (a bare array of `gui.inputs.*` items ' +
    'is fine — a `@golemui/gui-shared` import is added if missing). Returns `{ ok, diagnostics, ' +
    'expressionWarnings, validatorWarnings }`; each diagnostic has a TypeScript `code` (0 for the static lints), `message`, ' +
    '`line`/`column`, and — for recognized GolemUI mistakes — a `hint` with the fix. `expressionWarnings` ' +
    'and `validatorWarnings` are advisory and do not flip `ok` — surface them and apply their `suggestion`. ' +
    'Treat `ok: false` as blocking: apply the fixes and re-check until `ok` is true.',
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'The GolemUI `gui.*` DX snippet to type-check (TypeScript).',
      },
    },
    required: ['code'],
  },
} as const;
