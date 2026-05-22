import type { ErrorObject } from 'ajv';
import { COMPONENT_SCHEMAS } from '../schemas/index';
import {
  getShallowWidgetValidator,
  getValidatorBranchValidator,
  getValidatorBranches,
} from '../schemas/shallow-validators';

export type FormattedError = {
  path: string;
  message: string;
  suggestion?: string;
  keyword: string;
  params?: Record<string, unknown>;
};

export type FormattedResult = {
  errors: FormattedError[];
  warnings: FormattedError[];
};

const STRING_FORMATS = ['email', 'hostname', 'ipv4', 'ipv6', 'url', 'uuid', 'date', 'time', 'date-time', 'duration'];
const WIDGET_TYPES = Object.keys(COMPONENT_SCHEMAS);

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  // One-row dynamic programming — O(min(a,b)) memory, no nested arrays to defensively assert on.
  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const del = (prev[j] ?? 0) + 1;
      const ins = (curr[j - 1] ?? 0) + 1;
      const sub = (prev[j - 1] ?? 0) + cost;
      curr[j] = Math.min(del, ins, sub);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length] ?? 0;
}

function nearest(target: string, candidates: string[]): string | undefined {
  let best: string | undefined;
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = levenshtein(target.toLowerCase(), c.toLowerCase());
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  // Only suggest if the typo is close (≤ half the length of the target).
  return bestDist <= Math.max(2, Math.floor(target.length / 2)) ? best : undefined;
}

function suggestForAdditional(propertyName: string, instancePath: string): string | undefined {
  if (/\/validator(\/|$)/.test(instancePath)) {
    const validatorKeys = ['type', 'required', 'minLength', 'maxLength', 'minimum', 'maximum', 'pattern', 'format', 'const', 'enum', 'messages', 'minItems', 'maxItems', 'uniqueItems', 'multipleOf', 'exclusiveMinimum', 'exclusiveMaximum'];
    const guess = nearest(propertyName, validatorKeys);
    // Don't suggest the same property name back — that means the property is valid for *some*
    // validator type but not the one in use. The error message itself already conveys this.
    if (guess && guess !== propertyName) return `Did you mean \`${guess}\`?`;
    return undefined;
  }
  return undefined;
}

function suggestForEnum(value: unknown, allowed: unknown[]): string | undefined {
  if (typeof value !== 'string') return undefined;
  const stringAllowed = allowed.filter((v): v is string => typeof v === 'string');
  if (!stringAllowed.length) return undefined;
  const guess = nearest(value, stringAllowed);
  if (guess) return `Did you mean \`${guess}\`? Allowed values: ${stringAllowed.map((v) => `\`${v}\``).join(', ')}.`;
  return `Allowed values: ${stringAllowed.map((v) => `\`${v}\``).join(', ')}.`;
}

const VALIDATOR_TYPES = ['string', 'number', 'integer', 'boolean', 'array', 'custom'];

function suggestForConst(value: unknown, allowed: unknown, instancePath: string): string | undefined {
  if (typeof value !== 'string' || typeof allowed !== 'string') return undefined;
  // Common: a widget has wrong `type` value. Match only widget-level `/type` paths, NOT nested
  // type fields like `/validator/type` or `/props/items/type`.
  if (/^\/form\/\d+(?:\/children\/\d+)*(?:\/props\/template)?\/type$/.test(instancePath)) {
    const guess = nearest(value, WIDGET_TYPES);
    return guess ? `Did you mean \`type: '${guess}'\`?` : `Valid widget types: ${WIDGET_TYPES.map((v) => `\`${v}\``).join(', ')}.`;
  }
  if (instancePath.endsWith('/validator/type')) {
    const guess = nearest(value, VALIDATOR_TYPES);
    return guess ? `Did you mean \`type: '${guess}'\`?` : `Allowed validator types: ${VALIDATOR_TYPES.map((v) => `\`${v}\``).join(', ')}.`;
  }
  return undefined;
}

function describe(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return JSON.stringify(value);
}

/**
 * Formats ajv error objects into AI-friendly messages with concrete fix suggestions.
 * Designed for the case where an LLM produced the form and needs to self-correct on next turn.
 *
 * When `dataRoot` is provided, `oneOf` branches at widget positions are collapsed to just the
 * closest-matching branch — without this, a single `type: 'buton'` typo emits ~30 errors (one per
 * non-matching branch + a summary), most of which are noise.
 */
export function formatAjvErrors(
  errors: ErrorObject[] | null | undefined,
  dataRoot?: unknown,
): FormattedResult {
  if (!errors?.length) return { errors: [], warnings: [] };
  const collapsed =
    dataRoot !== undefined
      ? collapseOneOfErrors(errors, dataRoot)
      : { errors, warnings: [] as FormattedError[] };
  const filtered = collapsed.errors;
  const out: FormattedError[] = [];
  for (const err of filtered) {
    const path = err.instancePath || '/';
    let message = err.message ?? 'invalid value';
    let suggestion: string | undefined;

    switch (err.keyword) {
      case 'additionalProperties':
      case 'unevaluatedProperties': {
        const prop = (err.params as { additionalProperty?: string }).additionalProperty;
        if (prop) {
          message = `Unknown property \`${prop}\` at \`${path}\``;
          suggestion = suggestForAdditional(prop, path);
        }
        break;
      }
      case 'required': {
        const prop = (err.params as { missingProperty?: string }).missingProperty;
        if (prop) {
          message = `Missing required property \`${prop}\` at \`${path || '/'}\``;
        }
        break;
      }
      case 'enum': {
        const allowed = (err.params as { allowedValues?: unknown[] }).allowedValues ?? [];
        const v = describe(err.data);
        message = `Value ${v} at \`${path}\` is not one of the allowed values`;
        suggestion = suggestForEnum(err.data, allowed);
        break;
      }
      case 'const': {
        const allowed = (err.params as { allowedValue?: unknown }).allowedValue;
        message = `Expected \`${describe(allowed)}\` at \`${path}\`, got \`${describe(err.data)}\``;
        suggestion = suggestForConst(err.data, allowed, path);
        break;
      }
      case 'type': {
        const expected = (err.params as { type?: string | string[] }).type;
        message = `Expected type ${Array.isArray(expected) ? expected.join('|') : expected} at \`${path}\`, got ${describe(err.data)}`;
        break;
      }
      case 'oneOf':
      case 'anyOf': {
        message = `Value at \`${path}\` does not match any allowed variant`;
        // Most useful errors here come from the sibling errors at the same path; ajv emits both.
        // We'll keep this one as a backstop summary.
        break;
      }
      default:
        message = `${err.message ?? 'invalid value'} at \`${path}\``;
    }

    // Widget-specific hint: validator.format
    if (path.endsWith('/validator/format') && err.keyword === 'enum') {
      suggestion = `Allowed string formats: ${STRING_FORMATS.map((f) => `\`${f}\``).join(', ')}.`;
    }

    out.push({
      path,
      message,
      suggestion,
      keyword: err.keyword,
      params: err.params as Record<string, unknown>,
    });
  }
  return { errors: dedupe(out), warnings: collapsed.warnings };
}

/**
 * Extracts the widget object's instance path from a JSON Pointer pointing into a form definition.
 * Returns null if the path isn't inside a widget.
 */
function extractWidgetPath(instancePath: string): string | null {
  const m = instancePath.match(/^(\/form\/\d+(?:\/children\/\d+)*)/);
  return m ? m[1]! : null;
}

/**
 * Picks the component schema the widget *intended* to match, based on its actual `kind`+`type`
 * data. Used to filter the `oneOf` error spray down to the one branch the user almost wrote.
 *
 * Priority:
 *   1. Exact `type` match (covers the happy path and all non-type errors).
 *   2. Fuzzy `type` match within branches whose `kind.const` matches the widget's kind.
 *   3. Fuzzy `type` match across all branches (when kind is also wrong/missing).
 */
function pickIntendedBranch(widget: unknown): { $id: string; type: string } | null {
  if (!widget || typeof widget !== 'object') return null;
  const w = widget as { kind?: unknown; type?: unknown };
  const widgetType = typeof w.type === 'string' ? w.type : undefined;
  const widgetKind = typeof w.kind === 'string' ? w.kind : undefined;

  if (widgetType && COMPONENT_SCHEMAS[widgetType]) {
    return { $id: COMPONENT_SCHEMAS[widgetType].$id, type: widgetType };
  }
  if (!widgetType) return null;

  const kindMatched = Object.entries(COMPONENT_SCHEMAS).filter(([, schema]) => {
    const k = (schema['properties'] as Record<string, { const?: unknown }> | undefined)?.['kind']
      ?.const;
    return k === widgetKind;
  });
  const pool = kindMatched.length ? kindMatched : Object.entries(COMPONENT_SCHEMAS);

  const candidateTypes = pool.map(([t]) => t);
  const match = nearest(widgetType, candidateTypes);
  if (!match) return null;
  return { $id: COMPONENT_SCHEMAS[match]!.$id, type: match };
}

/**
 * Replaces the `oneOf` error explosion with clean per-widget errors. The form schema is a `oneOf`
 * over 26 widget types — ajv with `allErrors: true` emits errors for *every* non-matching branch,
 * so a single typo produces ~30 errors, only one of which is useful. The intended branch is
 * additionally "silent" (no `$id` or const signal in the error stream) when its deep errors are
 * the only failure, which defeats any heuristic that tries to identify it from the error stream.
 *
 * Instead, we re-validate each widget against its intended branch's schema directly — picked from
 * the widget's actual `kind`+`type` data via {@link pickIntendedBranch}. Children/templates are
 * loosened in those schemas (see {@link getShallowWidgetValidator}) so we can recurse into them
 * one widget at a time, never triggering the global oneOf again.
 *
 * Top-level errors (form-level required, unknown root props, state expressions) are preserved
 * from the original validation pass.
 */
function collapseOneOfErrors(
  errors: ErrorObject[],
  dataRoot: unknown,
): { errors: ErrorObject[]; warnings: FormattedError[] } {
  const topLevel: ErrorObject[] = [];
  for (const err of errors) {
    if (extractWidgetPath(err.instancePath) === null) topLevel.push(err);
  }

  const widgetErrors: ErrorObject[] = [];
  const warnings: FormattedError[] = [];
  const form = (dataRoot as { form?: unknown })?.form;
  if (Array.isArray(form)) {
    form.forEach((widget, i) => {
      collectWidgetErrors(widget, `/form/${i}`, widgetErrors, warnings);
    });
  }

  return { errors: [...topLevel, ...widgetErrors], warnings };
}

/**
 * Recursively validates a single widget against its intended branch's shallow schema, then
 * descends into its `children` / `props.template`. Errors are returned with full instance paths
 * (rooted at the form definition, not the widget).
 *
 * When the widget's `type` is set to something that doesn't match (even fuzzily) any built-in
 * widget, we treat it as a custom widget and emit a `warning` instead of a hard error — devs
 * who extend GolemUI with their own widget types shouldn't fail validation just because we
 * can't introspect their props.
 */
function collectWidgetErrors(
  widget: unknown,
  widgetPath: string,
  out: ErrorObject[],
  warnings: FormattedError[],
): void {
  const intended = pickIntendedBranch(widget);
  if (!intended) {
    const widgetType = (widget as { type?: unknown } | undefined)?.type;
    if (typeof widgetType !== 'string' || !widgetType) {
      // No usable `type` at all — that's a hard error.
      out.push(
        {
          keyword: 'required',
          instancePath: widgetPath,
          schemaPath: '',
          params: { missingProperty: 'type' },
          message: `Widget at ${widgetPath} is missing or has an invalid \`type\``,
        } as unknown as ErrorObject,
      );
    } else {
      // Type is set but doesn't match any built-in — assume custom widget and warn.
      warnings.push({
        path: `${widgetPath}/type`,
        keyword: 'customWidget',
        message: `Widget type \`${widgetType}\` at \`${widgetPath}\` is not a built-in GolemUI widget — assumed custom. Its props were not validated.`,
        suggestion:
          'Built-in widget types: ' +
          Object.keys(COMPONENT_SCHEMAS).join(', ') +
          '. If this is intentional (a custom widget registered via the framework loader), you can ignore this warning.',
        params: { type: widgetType },
      });
    }
    // Even for an unknown widget, recurse into nested standard widgets so we don't miss errors
    // in their content (a custom layout may wrap normal form widgets in its `children`).
    recurseIntoChildren(widget, widgetPath, out, warnings);
    return;
  }

  const validator = getShallowWidgetValidator(intended.type);
  if (validator) {
    validator(widget);
    for (const e of validator.errors ?? []) {
      out.push({
        ...e,
        instancePath: widgetPath + e.instancePath,
      });
    }
  }

  const w = widget as
    | { type?: unknown; validator?: unknown; children?: unknown; props?: { template?: unknown } }
    | undefined;

  // Validate the widget's `validator` field (skipped by the shallow widget schema). Its own oneOf
  // would otherwise produce 5 branches of noise; we pick the matching branch from `validator.type`.
  if (w?.validator && typeof w.validator === 'object') {
    collectValidatorErrors(w.validator, `${widgetPath}/validator`, out);
  }
  // State-scoped validator variants (e.g. `validator.register: {...}`). Same shallow-loosening
  // applies in the widget schema, so we revalidate each variant against its own branch.
  if (widget && typeof widget === 'object' && !Array.isArray(widget)) {
    for (const [key, value] of Object.entries(widget as Record<string, unknown>)) {
      if (key.startsWith('validator.') && value && typeof value === 'object') {
        collectValidatorErrors(value, `${widgetPath}/${key}`, out);
      }
    }
  }

  recurseIntoChildren(widget, widgetPath, out, warnings);
}

function recurseIntoChildren(
  widget: unknown,
  widgetPath: string,
  out: ErrorObject[],
  warnings: FormattedError[],
): void {
  const w = widget as
    | { type?: unknown; children?: unknown; props?: { template?: unknown } }
    | undefined;
  if (Array.isArray(w?.children)) {
    w.children.forEach((child, i) => {
      collectWidgetErrors(child, `${widgetPath}/children/${i}`, out, warnings);
    });
  }
  if (w?.type === 'repeater' && w.props?.template) {
    collectWidgetErrors(w.props.template, `${widgetPath}/props/template`, out, warnings);
  }
}

function collectValidatorErrors(validator: unknown, path: string, out: ErrorObject[]): void {
  const v = validator as { type?: unknown };
  const t = typeof v.type === 'string' ? v.type : null;
  const branches = getValidatorBranches();
  const matchedType = t && branches.includes(t) ? t : t ? nearest(t, branches as string[]) : undefined;
  if (!matchedType) {
    out.push({
      keyword: 'enum',
      instancePath: `${path}/type`,
      schemaPath: '',
      params: { allowedValues: branches },
      message: `Validator type is not one of ${branches.join(', ')}`,
      data: t,
    } as unknown as ErrorObject);
    return;
  }
  const compiled = getValidatorBranchValidator(matchedType);
  if (!compiled) return;
  compiled(validator);
  for (const e of compiled.errors ?? []) {
    out.push({ ...e, instancePath: path + e.instancePath });
  }
}

function dedupe(errors: FormattedError[]): FormattedError[] {
  const seen = new Set<string>();
  const result: FormattedError[] = [];
  for (const e of errors) {
    const key = `${e.path}|${e.keyword}|${e.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(e);
  }
  return result;
}

/**
 * Best-effort widget context: given a JSON Pointer path into a form definition, returns the
 * widget's `type` if discoverable. Used to add "in widget X" context to error messages.
 */
export function describePath(path: string): string {
  if (!path) return 'root';
  return path;
}

export { STRING_FORMATS };
