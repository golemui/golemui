import type { DotPath, JsonSchemaFragment, WidgetValueSchema } from '@golemui/core';
import { cloneObject } from '@golemui/core';
import { get, pathExists, set } from '@golemui/core/internals';
import type { FieldEntry } from './schema';

/** The outcome of applying an agent's input to the form data. */
export type AppliedInput = {
  /** The next form data: the current data with the accepted values written in. */
  data: Record<string, unknown>;
  /** The top-level fields that received a value. */
  written: FieldEntry[];
  /** Input keys that match no fillable field. */
  ignored: string[];
  /** Values rejected by the field's description, by data path. */
  errors: Record<DotPath, string[]>;
};

type Coerced = { ok: true; value: unknown } | { ok: false; message: string };

const accept = (value: unknown): Coerced => ({ ok: true, value });
const reject = (message: string): Coerced => ({ ok: false, message });

type Choices = NonNullable<WidgetValueSchema['choices']>;

/**
 * Writes the agent's input into a copy of the form data, field by field. Only declared,
 * fillable fields are read from the input (never the input's own keys, so a `__proto__` key
 * cannot reach the data), values are coerced to the field's type, and choice labels are
 * mapped to their values.
 */
export function applyInput(
  input: Record<string, unknown>,
  fields: FieldEntry[],
  currentData: Record<string, unknown>,
): AppliedInput {
  const data = cloneObject(currentData) as Record<string, unknown>;
  const applied: AppliedInput = { data, written: [], ignored: [], errors: {} };
  const fillable = fields.filter((field) => field.fillable);

  for (const field of fillable) {
    if (!pathExists(input, field.path)) {
      continue;
    }
    const coerced = coerceValue(get(input, field.path), field);
    if (coerced.ok) {
      set(data, field.path, coerced.value);
      applied.written.push(field);
    } else {
      applied.errors[field.path] = [...(applied.errors[field.path] ?? []), coerced.message];
    }
  }

  applied.ignored = unknownKeys(
    input,
    fillable.map((field) => field.path),
  );
  return applied;
}

function coerceValue(raw: unknown, field: FieldEntry): Coerced {
  if (raw === null || raw === undefined) {
    return accept(null);
  }
  if (field.children !== undefined) {
    return coerceRows(raw, field);
  }
  const choices = field.value.choices;
  if (field.property['type'] === 'array') {
    if (!Array.isArray(raw)) {
      return reject('Expected a list of values');
    }
    if (choices === undefined) {
      return accept(raw);
    }
    const values: unknown[] = [];
    for (const item of raw) {
      const matched = matchChoice(item, choices);
      if (matched === NO_MATCH) {
        return reject(unknownChoice(item, choices));
      }
      values.push(matched);
    }
    return accept(values);
  }
  if (choices !== undefined) {
    const matched = matchChoice(raw, choices);
    return matched === NO_MATCH ? reject(unknownChoice(raw, choices)) : accept(matched);
  }
  return coerceScalar(raw, field.property);
}

function coerceRows(raw: unknown, field: FieldEntry): Coerced {
  if (!Array.isArray(raw)) {
    return reject('Expected a list of rows');
  }
  const rows: Record<string, unknown>[] = [];
  for (const item of raw) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      return reject('Each row must be an object');
    }
    const source = item as Record<string, unknown>;
    const row: Record<string, unknown> = {};
    for (const child of field.children ?? []) {
      if (!child.fillable || !pathExists(source, child.path)) {
        continue;
      }
      const coerced = coerceValue(get(source, child.path), child);
      if (!coerced.ok) {
        return reject(`${child.path}: ${coerced.message}`);
      }
      set(row, child.path, coerced.value);
    }
    rows.push(row);
  }
  return accept(rows);
}

function coerceScalar(raw: unknown, schema: JsonSchemaFragment): Coerced {
  const type = schema['type'];
  const types: string[] = Array.isArray(type)
    ? (type as string[])
    : typeof type === 'string'
      ? [type]
      : [];
  if (types.length === 0 || types.includes(typeof raw)) {
    return accept(raw);
  }
  if (types.includes('integer') && typeof raw === 'number') {
    return accept(raw);
  }
  if ((types.includes('number') || types.includes('integer')) && typeof raw === 'string') {
    const trimmed = raw.trim();
    const parsed = Number(trimmed);
    if (trimmed !== '' && Number.isFinite(parsed)) {
      return accept(parsed);
    }
  }
  if (types.includes('boolean') && typeof raw === 'string') {
    const lowered = raw.trim().toLowerCase();
    if (['true', 'yes', 'on', '1'].includes(lowered)) {
      return accept(true);
    }
    if (['false', 'no', 'off', '0'].includes(lowered)) {
      return accept(false);
    }
  }
  if (types.includes('string') && (typeof raw === 'number' || typeof raw === 'boolean')) {
    return accept(String(raw));
  }
  return reject(`Expected ${types.join(' or ')}`);
}

const NO_MATCH = Symbol('no-match');

/** A choice's value, given its value or its label (case-insensitive, whitespace-trimmed). */
function matchChoice(raw: unknown, choices: Choices): unknown {
  const exact = choices.find((choice) => choice.value === raw);
  if (exact !== undefined) {
    return exact.value;
  }
  const needle = String(raw).trim().toLowerCase();
  const byText = choices.find(
    (choice) =>
      String(choice.value).trim().toLowerCase() === needle ||
      choice.label.trim().toLowerCase() === needle,
  );
  return byText !== undefined ? byText.value : NO_MATCH;
}

function unknownChoice(raw: unknown, choices: Choices): string {
  const shown = choices.slice(0, 10).map((choice) => choice.label);
  const more = choices.length > shown.length ? `, … (${choices.length} in total)` : '';
  return `Unknown option ${JSON.stringify(raw)}. Accepted: ${shown.join(', ')}${more}`;
}

/**
 * The input's keys that no fillable field covers, reported at the outermost unknown level:
 * a key is skipped when it is a field, descended into when it is an ancestor of a field (an
 * object holding fields), and reported otherwise.
 */
function unknownKeys(input: Record<string, unknown>, declared: DotPath[]): string[] {
  const unknown: string[] = [];
  const isAncestor = (path: DotPath) => declared.some((field) => field.startsWith(`${path}.`));
  const walk = (node: Record<string, unknown>, prefix: string) => {
    for (const key of Object.keys(node)) {
      const path = prefix === '' ? key : `${prefix}.${key}`;
      if (declared.includes(path)) {
        continue;
      }
      const value = node[key];
      if (isAncestor(path) && value !== null && typeof value === 'object' && !Array.isArray(value)) {
        walk(value as Record<string, unknown>, path);
      } else {
        unknown.push(path);
      }
    }
  };
  walk(input, '');
  return unknown;
}

/**
 * A copy of the values fit for the agent: sensitive fields redacted, upload envelopes stripped
 * of the server response they carry.
 */
export function redactValues(
  values: Record<string, unknown>,
  fields: FieldEntry[],
): Record<string, unknown> {
  const redacted = cloneObject(values) as Record<string, unknown>;
  for (const field of fields) {
    // The derive writes an `undefined` placeholder for every input path, so presence alone
    // says nothing: only an actual value is redacted.
    if (!pathExists(redacted, field.path) || get(redacted, field.path) == null) {
      continue;
    }
    if (field.value.sensitive === true) {
      set(redacted, field.path, '[redacted]');
    } else if (field.value.writable === false) {
      set(redacted, field.path, stripEnvelopeData(get(redacted, field.path)));
    }
  }
  return redacted;
}

function stripEnvelopeData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripEnvelopeData);
  }
  if (value !== null && typeof value === 'object' && 'data' in (value as object)) {
    const { data: _data, ...rest } = value as Record<string, unknown>;
    return rest;
  }
  return value;
}
