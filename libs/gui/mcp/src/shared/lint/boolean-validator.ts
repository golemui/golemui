export type BooleanValidatorFinding = {
  path: string;
  message: string;
  suggestion: string;
};

/**
 * Semantic lint for boolean validators — the mandatory-checkbox trap.
 *
 * The runtime facts (see `@golemui/gui-validators`): a boolean validator has no
 * `required` refine, so `required: true` only rejects a MISSING value
 * (`undefined`/`null`) — an unchecked box holding `false` passes. And a validator
 * without `required: true` is wrapped in `optional()`, so `const: true` alone lets
 * the pristine `undefined` pass. Forcing a checkbox to be checked therefore needs
 * BOTH rules — either half alone validates something the author almost never means.
 *
 * Like `reactive-expressions.ts`, this is the shared engine for both surfaces:
 * {@link lintBooleanValidators} walks a JSON form definition, while the DX path
 * (`dx-lint.ts`) extracts each boolean-widget validator from the AST and funnels it
 * through {@link checkBooleanValidatorRules} — one rule set, no drift.
 */
export function checkBooleanValidatorRules(
  validator: { required?: unknown; const?: unknown },
  path: string,
): BooleanValidatorFinding[] {
  const findings: BooleanValidatorFinding[] = [];
  const requiredIsTrue = validator.required === true;
  const constPresent = 'const' in validator && validator.const !== undefined;

  if (requiredIsTrue && !constPresent) {
    findings.push({
      path,
      message:
        'Boolean validator has `required: true` but no `const` — this does NOT force the checkbox ' +
        'to be checked: `false` is a valid boolean and passes; `required` only rejects a missing ' +
        'value (`undefined`/`null`).',
      suggestion:
        'If this checkbox must be checked (e.g. terms acceptance), add `const: true` and set ' +
        '`messages.invalid` and `messages.const` to the same user-facing text. If a false value is ' +
        'genuinely acceptable, ignore this warning.',
    });
  }

  if (constPresent && !requiredIsTrue) {
    findings.push({
      path,
      message:
        'Boolean validator has `const` but no `required: true` — the pristine value passes: a ' +
        'never-touched checkbox holds `undefined`, and non-required validators skip validation ' +
        'entirely for `undefined`.',
      suggestion:
        'Add `required: true` so the untouched state fails too, and set `messages.invalid` and ' +
        '`messages.const` to the same user-facing text.',
    });
  }

  return findings;
}

/**
 * Walks a JSON form definition and applies {@link checkBooleanValidatorRules} to every
 * boolean validator — the `validator` key and its state-suffixed variants
 * (`"validator.<stateName>"`) on any widget, at any nesting depth (layout `children`,
 * repeater `props.template`). Only validators declaring `"type": "boolean"` are
 * checked; shape errors on other types are the JSON Schemas' job.
 */
export function lintBooleanValidators(formDefinition: unknown): BooleanValidatorFinding[] {
  const findings: BooleanValidatorFinding[] = [];
  walk(formDefinition, '', findings);
  return findings;
}

function walk(node: unknown, path: string, out: BooleanValidatorFinding[]): void {
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((item, i) => walk(item, `${path}/${i}`, out));
    return;
  }
  const obj = node as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (
      (key === 'validator' || key.startsWith('validator.')) &&
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>)['type'] === 'boolean'
    ) {
      out.push(...checkBooleanValidatorRules(value as Record<string, unknown>, `${path}/${key}`));
    }
    walk(value, `${path}/${key}`, out);
  }
}
