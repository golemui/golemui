import type { ReactNode } from 'react';
import type {
  EndpointPayload,
  FieldSchema,
  FieldType,
  RecordSchema,
} from './deriveFormDefinition';

/**
 * Record-builder + display helpers shared by the FORMS AS DATA demos.
 * ==================================================================
 * Both the sasha-demo (the bare app on /demos) and the quests-portal (the 8-bit
 * walk) edit the same "server response" rows, derive the same form, and
 * highlight the same JSON — so this logic lives here once. React-free apart from
 * `highlightJson`, which only constructs `<span>` token nodes for the JSON view.
 */

/** One editable row in the SERVER response builder. */
export type RecordRow = { id: string; name: string; field: FieldSchema; value: string };

/** A normalized enum option (value drives data, label drives display). */
export type OptionPair = { label: string; value: string };

export function valueToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

export function stringToValue(s: string, type: FieldType): unknown {
  if (type === 'number') return s === '' ? 0 : Number(s);
  if (type === 'boolean') return s.trim().toLowerCase() === 'true';
  return s;
}

export function rowsFromPayload(payload: EndpointPayload): RecordRow[] {
  return Object.entries(payload.schema).map(([name, field]) => ({
    id: crypto.randomUUID(),
    name,
    field,
    value: valueToString(payload.data[name]),
  }));
}

// Turn a field key into a readable label (snake/kebab/camel → Title-ish).
export function humanize(key: string): string {
  const s = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : key;
}

export function buildPayload(rows: RecordRow[]): EndpointPayload {
  const schema: RecordSchema = {};
  const data: Record<string, unknown> = {};
  for (const r of rows) {
    const key = r.name.trim();
    if (!key) continue;
    // Always give the field a label — user-added rows only edit the key, so an
    // empty label would render blank (and a broken boolean toggle).
    const field: FieldSchema = {
      ...r.field,
      label: r.field.label?.trim() ? r.field.label : humanize(key),
    };
    // Enum options need a value to drive the data; drop half-typed (blank-value)
    // options so a freshly-added option never renders as an empty dropdown item,
    // and fall back to the value when its label hasn't been typed yet.
    if (field.type === 'enum') {
      field.options = (field.options ?? [])
        .map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
        .filter((o) => o.value.trim() !== '')
        .map((o) => ({ value: o.value, label: o.label.trim() ? o.label : o.value }));
    }
    schema[key] = field;
    data[key] = stringToValue(r.value, r.field.type);
  }
  return { schema, data };
}

// The form's remount key — its STRUCTURE (fields, types, options), derived from
// the built schema so half-typed blank options don't churn it.
export function schemaKey(schema: RecordSchema): string {
  return Object.entries(schema)
    .map(
      ([name, f]) =>
        `${name}:${f.type}:${(f.options ?? [])
          .map((o) => (typeof o === 'string' ? o : `${o.value}=${o.label}`))
          .join('|')}`,
    )
    .join(',');
}

// Lightweight JSON syntax highlight for the middle column — keys / strings /
// keywords / numbers / punctuation, matching the {gui.} code-window palette.
export function highlightJson(json: string): ReactNode[] {
  const re = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)|([{}[\],])/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(json))) {
    if (m.index > last) out.push(json.slice(last, m.index));
    if (m[1]) out.push(<span key={k++} className="t-key">{m[1]}</span>);
    else if (m[2]) out.push(<span key={k++} className="t-str">{m[2]}</span>);
    else if (m[3]) out.push(<span key={k++} className="t-kw">{m[3]}</span>);
    else if (m[4]) out.push(<span key={k++} className="t-num">{m[4]}</span>);
    else out.push(<span key={k++} className="t-punc">{m[0]}</span>);
    last = re.lastIndex;
  }
  if (last < json.length) out.push(json.slice(last));
  return out;
}
