/**
 * Per-widget validators that check a single widget against its own component schema, with
 * recursive content (`children`, `props.template`) loosened to permissive primitives.
 *
 * Why: the form schema's `oneOf` over 26 widget types means a single typo produces ~30 errors
 * — one per non-matching branch + a summary. By picking the *intended* branch from the widget's
 * actual `kind`/`type` data and validating ONLY against that branch's schema, we get clean,
 * actionable errors with no oneOf noise. Children/templates are validated separately by
 * recursing into them, again one widget at a time.
 */

import type Ajv2020 from 'ajv/dist/2020.js';
import type { ValidateFunction } from 'ajv';
import { COMPONENT_SCHEMAS, VALIDATORS_SCHEMA } from './index';
import { getAjv } from './ajv';

const cache = new Map<string, ValidateFunction>();
const validatorBranchCache = new Map<string, ValidateFunction>();

/**
 * Map from a validator's `type` field value to its `$defs` key in validators.schema.json.
 * `'integer'` also maps to numberValidator since that branch accepts both.
 */
const VALIDATOR_TYPE_TO_DEF: Record<string, string> = {
  string: 'stringValidator',
  number: 'numberValidator',
  integer: 'numberValidator',
  boolean: 'booleanValidator',
  array: 'arrayValidator',
  custom: 'customValidator',
};

export function getValidatorBranches(): readonly string[] {
  return Object.keys(VALIDATOR_TYPE_TO_DEF);
}

/**
 * Returns a validator that checks a GolemUI `validator` field against the branch corresponding
 * to its `type` value (e.g. `type: 'string'` → stringValidator branch). Returns null if the
 * validator's type isn't a known branch.
 */
export function getValidatorBranchValidator(validatorType: string): ValidateFunction | null {
  const defKey = VALIDATOR_TYPE_TO_DEF[validatorType];
  if (!defKey) return null;
  if (validatorBranchCache.has(defKey)) return validatorBranchCache.get(defKey)!;
  const defs = (VALIDATORS_SCHEMA as unknown as { $defs?: Record<string, unknown> }).$defs ?? {};
  const branch = defs[defKey];
  if (!branch) return null;
  // Bundle the whole `$defs` map alongside the branch so its internal `#/$defs/...` refs still
  // resolve when compiled standalone. Cross-file refs (`./common.schema.json#/...`) are rewritten
  // to absolute URLs that match the registered common schema.
  const cloned = {
    ...(JSON.parse(JSON.stringify(branch)) as Record<string, unknown>),
    $defs: JSON.parse(JSON.stringify(defs)) as Record<string, unknown>,
  };
  rewriteRefs(cloned, VALIDATORS_SCHEMA.$id);
  const ajv: Ajv2020 = getAjv();
  const v = ajv.compile(cloned);
  validatorBranchCache.set(defKey, v);
  return v;
}

/**
 * Returns a validator for the given widget type that checks the widget's own properties without
 * recursing into nested widgets. Returns null if the widget type is unknown.
 */
export function getShallowWidgetValidator(widgetType: string): ValidateFunction | null {
  if (cache.has(widgetType)) return cache.get(widgetType)!;
  const schema = COMPONENT_SCHEMAS[widgetType];
  if (!schema) return null;
  const shallow = makeShallow(schema, schema.$id);
  const ajv: Ajv2020 = getAjv();
  // Compile inline (no registry add) — the shallow schema keeps no $id, so it doesn't conflict
  // with the already-registered original component schema. Relative $refs were rewritten to
  // absolute URLs in makeShallow so they still resolve against the registered common/validators.
  const validator = ajv.compile(shallow);
  cache.set(widgetType, validator);
  return validator;
}

/**
 * Returns a deep clone of `schema` with:
 *   - the `$id` stripped (so ajv.compile won't collide with the registered original)
 *   - all relative `$ref`s rewritten to absolute (since stripping the $id loses the base URI)
 *   - recursive widget refs loosened: `children` → `{ type: 'array' }`, `props.template` → `{ type: 'object' }`.
 *
 * Anything else is preserved verbatim so the widget's own props still get validated strictly.
 */
function makeShallow(schema: { $id?: string; [k: string]: unknown }, baseId: string): Record<string, unknown> {
  const cloned = JSON.parse(JSON.stringify(schema)) as Record<string, unknown>;
  rewriteRefs(cloned, baseId);
  delete cloned['$id'];

  const props = (cloned['properties'] as Record<string, unknown> | undefined) ?? {};
  if (props['children']) {
    props['children'] = { type: 'array' };
  }
  if (props['validator']) {
    // Validators have their own oneOf which produces its own noise. We validate them separately
    // against the branch picked from `validator.type` — see getValidatorBranchValidator.
    props['validator'] = { type: 'object' };
  }
  // Same treatment for state-scoped validator variants declared via patternProperties
  // (e.g. `^validator\.[^.]+$`). The pattern still admits the key shape, but the value is
  // validated as a plain object — the per-state validator gets its own targeted pass.
  const patternProps = cloned['patternProperties'] as Record<string, unknown> | undefined;
  if (patternProps) {
    for (const key of Object.keys(patternProps)) {
      if (key.startsWith('^validator\\.')) {
        patternProps[key] = { type: 'object' };
      }
    }
  }
  const propsField = props['props'] as { properties?: Record<string, unknown> } | undefined;
  if (propsField?.properties?.['template']) {
    propsField.properties['template'] = { type: 'object' };
  }
  return cloned;
}

function rewriteRefs(node: unknown, baseId: string): void {
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) rewriteRefs(item, baseId);
    return;
  }
  const obj = node as Record<string, unknown>;
  if (typeof obj['$ref'] === 'string') {
    const ref = obj['$ref'];
    // Leave already-absolute and same-document refs alone.
    if (!ref.startsWith('http') && !ref.startsWith('#')) {
      try {
        obj['$ref'] = new URL(ref, baseId).href;
      } catch {
        // leave it
      }
    }
  }
  for (const v of Object.values(obj)) rewriteRefs(v, baseId);
}
