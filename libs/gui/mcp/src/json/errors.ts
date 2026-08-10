import type { ErrorObject } from 'ajv';
import { COMPONENT_SCHEMAS, WIDGETS_SCHEMA } from './schemas/index';
import {
  getChunkRefValidator,
  getCustomWidgetKinds,
  getCustomWidgetValidator,
  getShallowWidgetValidator,
  getValidatorBranchValidator,
  getValidatorBranches,
} from './schemas/shallow-validators';

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

const STRING_FORMATS = [
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'url',
  'uuid',
  'date',
  'time',
  'date-time',
  'duration',
];
const WIDGET_TYPES = Object.keys(COMPONENT_SCHEMAS);

// Built-in types with no component schema (e.g. `renderer`). The published schema
// rejects them, so they must get a hard error, not a warning or a fuzzy match.
const SCHEMALESS_WIDGET_TYPES: ReadonlySet<string> = new Set(
  (
    ((WIDGETS_SCHEMA['$defs'] as Record<string, { enum?: unknown[] } | undefined> | undefined)?.[
      'knownWidgetTypes'
    ]?.enum ?? []) as string[]
  ).filter((type) => !COMPONENT_SCHEMAS[type]),
);

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  // One-row dynamic programming - O(min(a,b)) memory, no nested arrays to defensively assert on.
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

/**
 * Finds the candidate closest to `target`, or undefined when none is close enough.
 * @param maxDistance - Edit distance budget. Defaults to half the target's length.
 */
function nearest(target: string, candidates: string[], maxDistance?: number): string | undefined {
  let best: string | undefined;
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = levenshtein(target.toLowerCase(), c.toLowerCase());
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  const budget = maxDistance ?? Math.max(2, Math.floor(target.length / 2));
  return bestDist <= budget ? best : undefined;
}

/**
 * Edit distance budget for widget types. Tighter than the default: a type name is a custom widget
 * unless it is a near-miss of a built-in, and half the length is loose enough to turn distinct
 * names into false typos (`custom` is 3 edits from `button`).
 */
function widgetTypeDistance(widgetType: string): number {
  return Math.max(1, Math.floor(widgetType.length / 3));
}

function suggestForAdditional(propertyName: string, instancePath: string): string | undefined {
  if (/\/validator(\/|$)/.test(instancePath)) {
    const validatorKeys = [
      'type',
      'required',
      'minLength',
      'maxLength',
      'minimum',
      'maximum',
      'pattern',
      'format',
      'const',
      'enum',
      'messages',
      'minItems',
      'maxItems',
      'uniqueItems',
      'multipleOf',
      'exclusiveMinimum',
      'exclusiveMaximum',
    ];
    const guess = nearest(propertyName, validatorKeys);
    // Don't suggest the same name back (valid for another validator type, the message says so).
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
  if (guess)
    return `Did you mean \`${guess}\`? Allowed values: ${stringAllowed.map((v) => `\`${v}\``).join(', ')}.`;
  return `Allowed values: ${stringAllowed.map((v) => `\`${v}\``).join(', ')}.`;
}

const VALIDATOR_TYPES = ['string', 'number', 'integer', 'boolean', 'array', 'custom'];

function suggestForConst(
  value: unknown,
  allowed: unknown,
  instancePath: string,
): string | undefined {
  if (typeof value !== 'string' || typeof allowed !== 'string') return undefined;
  // Common: a widget has wrong `type` value. Match only widget-level `/type` paths, NOT nested
  // type fields like `/validator/type` or `/props/items/type`. `children` and `props/template`
  // segments can alternate any number of times (a template holds children that hold templates).
  if (/^\/form\/\d+(?:\/children\/\d+|\/props\/template)*\/type$/.test(instancePath)) {
    const guess = nearest(value, WIDGET_TYPES, widgetTypeDistance(value));
    return guess
      ? `Did you mean \`type: '${guess}'\`?`
      : `Valid widget types: ${WIDGET_TYPES.map((v) => `\`${v}\``).join(', ')}.`;
  }
  if (instancePath.endsWith('/validator/type')) {
    const guess = nearest(value, VALIDATOR_TYPES);
    return guess
      ? `Did you mean \`type: '${guess}'\`?`
      : `Allowed validator types: ${VALIDATOR_TYPES.map((v) => `\`${v}\``).join(', ')}.`;
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
 * Formats ajv errors into messages with concrete fix suggestions, aimed at an LLM
 * self-correcting the form it produced. With `dataRoot`, widget `oneOf` branches
 * collapse to the closest-matching one (a single typo otherwise emits ~30 errors).
 */
export function formatAjvErrors(
  errors: ErrorObject[] | null | undefined,
  dataRoot?: unknown,
): FormattedResult {
  // With a `dataRoot` we always run the per-widget pass, even when ajv reports no errors. The
  // custom-widget fallback in the form schema makes ajv accept any unknown `type` (including typos
  // of built-ins), so the targeted per-widget diagnostics (typo suggestions, custom-widget
  // warnings) are now the only place those are surfaced.
  if (!errors?.length && dataRoot === undefined) return { errors: [], warnings: [] };
  const collapsed =
    dataRoot !== undefined
      ? collapseOneOfErrors(errors ?? [], dataRoot)
      : { errors: errors as ErrorObject[], warnings: [] as FormattedError[] };
  const filtered = collapsed.errors;
  const out: FormattedError[] = [];
  for (const err of filtered) {
    const path = err.instancePath || '/';
    let message = err.message ?? 'invalid value';
    let suggestion: string | undefined;

    switch (err.keyword) {
      case 'additionalProperties':
      case 'unevaluatedProperties': {
        // Ajv names the offending key differently per keyword.
        const params = err.params as {
          additionalProperty?: string;
          unevaluatedProperty?: string;
        };
        const prop = params.additionalProperty ?? params.unevaluatedProperty;
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
      case 'schemalessType': {
        const type = (err.params as { type?: string }).type;
        message = `Widget type \`${type}\` at \`${path}\` is a built-in with no JSON representation, so it cannot appear in a JSON form definition`;
        suggestion = `Add this widget through the TS DX API instead (for example \`gui.displays.display(render)\`), or remove it from the JSON.`;
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
  const match = nearest(widgetType, candidateTypes, widgetTypeDistance(widgetType));
  if (!match) return null;
  return { $id: COMPONENT_SCHEMAS[match]!.$id, type: match };
}

/**
 * Replaces the `oneOf` error explosion (ajv emits errors for every non-matching
 * branch) with per-widget errors: each widget is re-validated against the branch
 * picked by {@link pickIntendedBranch}, using shallow schemas so recursion never
 * triggers the global oneOf. Top-level errors are kept from the original pass.
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

/** True for `{ "$ref": "./x.form-chunk.json" }` style entries, which stand in for a widget. */
function isChunkRef(widget: unknown): boolean {
  return (
    typeof widget === 'object' && widget !== null && !Array.isArray(widget) && '$ref' in widget
  );
}

/**
 * Validates one widget against its intended branch's shallow schema, then descends
 * into `children` / `props.template`, emitting full instance paths. A `type` that
 * matches no built-in (even fuzzily) is validated against the custom-widget schema
 * and produces a warning on top of any structural errors it has.
 */
function collectWidgetErrors(
  widget: unknown,
  widgetPath: string,
  out: ErrorObject[],
  warnings: FormattedError[],
): void {
  // A chunk reference is a legal formWidget member with no `type`, so it has to be handled
  // before everything below, all of which assumes the widget declares a type.
  if (isChunkRef(widget)) {
    const chunkRefValidator = getChunkRefValidator();
    chunkRefValidator(widget);
    for (const e of chunkRefValidator.errors ?? []) {
      out.push({ ...e, instancePath: widgetPath + e.instancePath });
    }
    return;
  }

  // Schema-less built-ins (e.g. `renderer`) must fail hard. Checked before the fuzzy
  // match, which could otherwise resolve `renderer` to `repeater` (within edit distance).
  const declaredType = (widget as { type?: unknown } | undefined)?.type;
  if (typeof declaredType === 'string' && SCHEMALESS_WIDGET_TYPES.has(declaredType)) {
    out.push({
      keyword: 'schemalessType',
      instancePath: `${widgetPath}/type`,
      schemaPath: '',
      params: { type: declaredType },
      message: `Widget type \`${declaredType}\` has no JSON representation`,
    } as unknown as ErrorObject);
    recurseIntoChildren(widget, widgetPath, out, warnings);
    return;
  }

  const intended = pickIntendedBranch(widget);
  if (!intended) {
    const widgetType = (widget as { type?: unknown } | undefined)?.type;
    if (typeof widgetType !== 'string' || !widgetType) {
      // No usable `type` at all - that's a hard error.
      out.push({
        keyword: 'required',
        instancePath: widgetPath,
        schemaPath: '',
        params: { missingProperty: 'type' },
        message: `Widget at ${widgetPath} is missing or has an invalid \`type\``,
      } as unknown as ErrorObject);
    } else {
      // Type is set but doesn't match any built-in - assume custom widget and warn.
      warnings.push({
        path: `${widgetPath}/type`,
        keyword: 'customWidget',
        message: `Widget type \`${widgetType}\` at \`${widgetPath}\` is not a built-in GolemUI widget - assumed custom. Its props were not validated.`,
        suggestion:
          'Built-in widget types: ' +
          Object.keys(COMPONENT_SCHEMAS).join(', ') +
          '. If this is intentional (a custom widget registered via the framework loader), you can ignore this warning.',
        params: { type: widgetType },
      });
      // `props` stays open, but the structure the widget's `kind` requires is still checked -
      // otherwise a custom widget missing e.g. `path` would come back valid.
      collectCustomWidgetErrors(widget, widgetPath, out);
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

  collectValidatorFieldErrors(widget, widgetPath, out);
  recurseIntoChildren(widget, widgetPath, out, warnings, intended.type);
}

/**
 * Validates a custom widget against the `custom.schema.json` branch matching its `kind`. The
 * type itself is already known to be non-built-in, so only the structure is checked here.
 */
function collectCustomWidgetErrors(widget: unknown, widgetPath: string, out: ErrorObject[]): void {
  const kind = (widget as { kind?: unknown } | undefined)?.kind;
  if (typeof kind !== 'string') {
    out.push({
      keyword: 'required',
      instancePath: widgetPath,
      schemaPath: '',
      params: { missingProperty: 'kind' },
      message: `Widget at ${widgetPath} is missing or has an invalid \`kind\``,
    } as unknown as ErrorObject);
    return;
  }
  const validator = getCustomWidgetValidator(kind);
  if (!validator) {
    out.push({
      keyword: 'enum',
      instancePath: `${widgetPath}/kind`,
      schemaPath: '',
      params: { allowedValues: getCustomWidgetKinds() },
      message: `Widget kind is not one of ${getCustomWidgetKinds().join(', ')}`,
      data: kind,
    } as unknown as ErrorObject);
    return;
  }
  validator(widget);
  const branchErrors = validator.errors ?? [];
  // A failing branch leaves its own properties unevaluated, so `unevaluatedProperties` fires as a
  // consequence of the real error. Report it only when it is the only thing wrong.
  const hasSpecificError = branchErrors.some((e) => e.keyword !== 'unevaluatedProperties');
  for (const e of branchErrors) {
    if (hasSpecificError && e.keyword === 'unevaluatedProperties') continue;
    out.push({ ...e, instancePath: widgetPath + e.instancePath });
  }
  // Only the input branch accepts a `validator` field, and only there is it loosened to a plain
  // object by getCustomWidgetValidator, so only there does it need its own pass.
  if (kind === 'input') {
    collectValidatorFieldErrors(widget, widgetPath, out);
  }
}

/**
 * Validates the widget's `validator` field and its state-scoped variants (e.g.
 * `validator.register`). Both are loosened to plain objects by the shallow widget schemas,
 * because the validator's own oneOf would otherwise produce 5 branches of noise. Here the
 * matching branch is picked from `validator.type` instead.
 */
function collectValidatorFieldErrors(
  widget: unknown,
  widgetPath: string,
  out: ErrorObject[],
): void {
  if (!widget || typeof widget !== 'object' || Array.isArray(widget)) return;
  const w = widget as Record<string, unknown>;
  if (w['validator'] && typeof w['validator'] === 'object') {
    collectValidatorErrors(w['validator'], `${widgetPath}/validator`, out);
  }
  for (const [key, value] of Object.entries(w)) {
    if (key.startsWith('validator.') && value && typeof value === 'object') {
      collectValidatorErrors(value, `${widgetPath}/${key}`, out);
    }
  }
}

/**
 * Descends into nested widgets. `resolvedType` is the type the fuzzy match settled on, so a
 * repeater with a typo'd type still gets its template checked.
 */
function recurseIntoChildren(
  widget: unknown,
  widgetPath: string,
  out: ErrorObject[],
  warnings: FormattedError[],
  resolvedType?: string,
): void {
  const w = widget as
    | { type?: unknown; children?: unknown; props?: { template?: unknown } }
    | undefined;
  if (Array.isArray(w?.children)) {
    w.children.forEach((child, i) => {
      collectWidgetErrors(child, `${widgetPath}/children/${i}`, out, warnings);
    });
  }
  if ((resolvedType ?? w?.type) === 'repeater' && w?.props?.template) {
    collectWidgetErrors(w.props.template, `${widgetPath}/props/template`, out, warnings);
  }
}

function collectValidatorErrors(validator: unknown, path: string, out: ErrorObject[]): void {
  const v = validator as { type?: unknown };
  const t = typeof v.type === 'string' ? v.type : null;
  const branches = getValidatorBranches();
  const matchedType =
    t && branches.includes(t) ? t : t ? nearest(t, branches as string[]) : undefined;
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
