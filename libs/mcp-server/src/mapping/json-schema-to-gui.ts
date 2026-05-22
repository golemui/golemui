/**
 * Deterministic mapping from a JSON Schema (the form-data shape) to a GolemUI form definition.
 *
 * Handles the practical 80% of API/Zod-derived schemas:
 *   - primitive properties (string/number/integer/boolean) with formats and constraints
 *   - enum strings as `select` (≤ 6 options) or `dropdown` (more)
 *   - nested objects rendered inline as `flex` layouts
 *   - arrays of objects as `repeater` with a `flex` template
 *
 * Constructs unmapped: anything we can't cleanly express. They're returned as `unmapped[]`
 * so the caller (and any LLM) can surface a partial form rather than a hard failure.
 */

import type { Validator } from './validator';
import { buildStringValidator, buildNumberValidator, buildBooleanValidator } from './validator';

export type JsonSchemaLike = {
  type?: string | string[];
  format?: string;
  title?: string;
  description?: string;
  enum?: unknown[];
  const?: unknown;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  default?: unknown;
  required?: string[];
  properties?: Record<string, JsonSchemaLike>;
  items?: JsonSchemaLike;
  oneOf?: JsonSchemaLike[];
  anyOf?: JsonSchemaLike[];
  $ref?: string;
  [k: string]: unknown;
};

export type MapOptions = {
  submitAction?: boolean;
  submitLabel?: string;
  layout?: 'vertical' | 'horizontal' | 'grid';
};

export type Unmapped = {
  path: string;
  reason: string;
};

export type MapResult = {
  formDefinition: { form: unknown[] };
  unmapped: Unmapped[];
};

const SECRET_HINTS = /(password|secret|api[_-]?key|token)/i;
const LONG_TEXT_MIN_LENGTH = 200;
const SELECT_THRESHOLD = 6;

export function jsonSchemaToGui(schema: JsonSchemaLike, opts: MapOptions = {}): MapResult {
  const unmapped: Unmapped[] = [];
  const root = unwrap(schema);
  const fields: unknown[] = [];

  if (root.type === 'object' || root.properties) {
    const required = new Set(root.required ?? []);
    for (const [name, propSchema] of Object.entries(root.properties ?? {})) {
      const widget = mapProperty(name, unwrap(propSchema), required.has(name), '', unmapped);
      if (widget) fields.push(widget);
    }
  } else {
    unmapped.push({
      path: '',
      reason: 'Top-level JSON Schema is not an object — only object schemas map to forms.',
    });
  }

  if (opts.submitAction !== false) {
    fields.push({
      kind: 'action',
      type: 'button',
      label: opts.submitLabel ?? 'Submit',
      on: { click: 'submit' },
      props: { variant: 'filled' },
    });
  }

  const wrapped =
    opts.layout && opts.layout !== 'vertical'
      ? [
          {
            kind: 'layout',
            type: opts.layout === 'grid' ? 'grid' : 'flex',
            props:
              opts.layout === 'grid'
                ? { columnGap: 12, rowGap: 12 }
                : { direction: 'row', gap: 12 },
            children: fields,
          },
        ]
      : fields;

  return {
    formDefinition: { form: wrapped },
    unmapped,
  };
}

function unwrap(schema: JsonSchemaLike): JsonSchemaLike {
  // Collapse simple `oneOf: [type, { type: 'null' }]` into the non-null branch (nullable).
  if (schema.oneOf?.length === 2) {
    const nonNull = schema.oneOf.find((s) => s.type !== 'null');
    if (nonNull) return { ...nonNull, ...stripBranches(schema) };
  }
  if (schema.anyOf?.length === 2) {
    const nonNull = schema.anyOf.find((s) => s.type !== 'null');
    if (nonNull) return { ...nonNull, ...stripBranches(schema) };
  }
  return schema;
}

function stripBranches(s: JsonSchemaLike): JsonSchemaLike {
  const { oneOf, anyOf, ...rest } = s;
  void oneOf;
  void anyOf;
  return rest;
}

function mapProperty(
  name: string,
  schema: JsonSchemaLike,
  required: boolean,
  parentPath: string,
  unmapped: Unmapped[],
): unknown | null {
  const path = parentPath ? `${parentPath}.${name}` : name;
  const label = humanLabel(schema.title ?? name);
  const t = Array.isArray(schema.type) ? schema.type.find((x) => x !== 'null') : schema.type;

  // Enums (string-typed) → select / dropdown.
  if (Array.isArray(schema.enum) && schema.enum.every((v) => typeof v === 'string')) {
    return buildEnumField(path, name, label, schema, required);
  }

  switch (t) {
    case 'string':
      return buildStringField(path, name, label, schema, required);
    case 'number':
    case 'integer':
      return buildNumberField(path, label, schema, required, t);
    case 'boolean':
      return buildBooleanField(path, label, schema, required);
    case 'object':
      return buildObjectGroup(path, name, label, schema, unmapped);
    case 'array':
      return buildArrayField(path, name, label, schema, unmapped);
    default:
      unmapped.push({
        path,
        reason: `Unsupported JSON Schema type \`${schema.type ?? 'undefined'}\`.`,
      });
      return null;
  }
}

function buildStringField(
  path: string,
  name: string,
  label: string,
  schema: JsonSchemaLike,
  required: boolean,
): unknown {
  const validator = buildStringValidator(schema, required);
  const isSecret = SECRET_HINTS.test(name);
  const isLong = (schema.maxLength ?? 0) >= LONG_TEXT_MIN_LENGTH;

  // Date/time formats → specialized widgets.
  if (schema.format === 'date') {
    return cleanFields({ kind: 'input', type: 'dateInput', path, label, validator });
  }
  if (schema.format === 'date-time') {
    return cleanFields({ kind: 'input', type: 'datePicker', path, label, validator });
  }

  if (isSecret) {
    return cleanFields({ kind: 'input', type: 'password', path, label, validator });
  }
  if (isLong) {
    return cleanFields({
      kind: 'input',
      type: 'textarea',
      path,
      label,
      validator,
      props: schema.description ? { hint: schema.description } : undefined,
    });
  }

  return cleanFields({
    kind: 'input',
    type: 'textinput',
    path,
    label,
    validator,
    props: schema.description ? { hint: schema.description } : undefined,
  });
}

function buildEnumField(
  path: string,
  name: string,
  label: string,
  schema: JsonSchemaLike,
  required: boolean,
): unknown {
  const values = (schema.enum ?? []) as string[];
  const validator: Validator | undefined = required
    ? { type: 'string', required: true, enum: values }
    : { type: 'string', enum: values };

  if (values.length <= SELECT_THRESHOLD) {
    return cleanFields({
      kind: 'input',
      type: 'select',
      path,
      label,
      validator,
      props: {
        options: values.map((v) => ({ label: humanLabel(v), value: v })),
      },
    });
  }
  return cleanFields({
    kind: 'input',
    type: 'dropdown',
    path,
    label,
    validator,
    props: {
      labelField: 'label',
      valueField: 'value',
      items: values.map((v) => ({ label: humanLabel(v), value: v })),
    },
  });
}

function buildNumberField(
  path: string,
  label: string,
  schema: JsonSchemaLike,
  required: boolean,
  t: 'number' | 'integer',
): unknown {
  const validator = buildNumberValidator(schema, required, t);
  return cleanFields({
    kind: 'input',
    type: 'number',
    path,
    label,
    validator,
    props: schema.description ? { hint: schema.description } : undefined,
  });
}

function buildBooleanField(
  path: string,
  label: string,
  schema: JsonSchemaLike,
  required: boolean,
): unknown {
  const validator = buildBooleanValidator(schema, required);
  return cleanFields({ kind: 'input', type: 'checkbox', path, label, validator });
}

function buildObjectGroup(
  path: string,
  _name: string,
  _label: string,
  schema: JsonSchemaLike,
  unmapped: Unmapped[],
): unknown | null {
  const required = new Set(schema.required ?? []);
  const children: unknown[] = [];
  for (const [childName, childSchema] of Object.entries(schema.properties ?? {})) {
    const w = mapProperty(childName, unwrap(childSchema), required.has(childName), path, unmapped);
    if (w) children.push(w);
  }
  if (!children.length) {
    unmapped.push({ path, reason: 'Object has no mappable properties.' });
    return null;
  }
  // Group fields in a flex column. No section heading — `markdownText` is not allowed as a
  // top-level form widget in GolemUI, and the user can label the section via tabs/accordion
  // or by editing the generated form definition.
  return {
    kind: 'layout',
    type: 'flex',
    props: { direction: 'column', gap: 8 },
    children,
  };
}

function buildArrayField(
  path: string,
  _name: string,
  label: string,
  schema: JsonSchemaLike,
  unmapped: Unmapped[],
): unknown | null {
  const items = schema.items ? unwrap(schema.items) : undefined;
  if (!items) {
    unmapped.push({ path, reason: 'Array without `items` schema cannot be mapped.' });
    return null;
  }
  if (items.type === 'object') {
    const templateChildren: unknown[] = [];
    const required = new Set(items.required ?? []);
    for (const [childName, childSchema] of Object.entries(items.properties ?? {})) {
      // Inside a repeater template, paths are relative — no dotted parent prefix.
      const w = mapProperty(childName, unwrap(childSchema), required.has(childName), '', unmapped);
      if (w) templateChildren.push(w);
    }
    if (!templateChildren.length) {
      unmapped.push({ path, reason: 'Array of objects has no mappable item properties.' });
      return null;
    }
    return {
      kind: 'input',
      type: 'repeater',
      path,
      label,
      props: {
        addLabel: `Add ${singular(label).toLowerCase()}`,
        removeLabel: 'Remove',
        template: {
          kind: 'layout',
          type: 'flex',
          props: { direction: 'column', gap: 8 },
          children: templateChildren,
        },
      },
    };
  }
  unmapped.push({
    path,
    reason: 'Only arrays of objects are mappable in v1 (used as repeaters).',
  });
  return null;
}

function humanLabel(name: string): string {
  if (!name) return '';
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function singular(label: string): string {
  if (label.endsWith('ies') && label.length > 3) return label.slice(0, -3) + 'y';
  if (label.endsWith('s') && !label.endsWith('ss')) return label.slice(0, -1);
  return label;
}

function cleanFields<T extends Record<string, unknown>>(o: T): T {
  for (const k of Object.keys(o)) {
    if (o[k] === undefined) delete o[k];
  }
  return o;
}
