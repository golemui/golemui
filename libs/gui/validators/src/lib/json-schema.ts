import type { JsonSchemaFragment, ValidatorSchema } from '@golemui/core';
import type { Validator } from './validators';

/**
 * The gui validator keys whose names and semantics are those of JSON Schema, per validator
 * type. Everything else (`messages`, `blockPendingUploads`, custom validator settings) is
 * behaviour of the validation engine, not a description of the value, and is left out.
 */
const KEYWORDS_BY_TYPE: Record<string, readonly string[]> = {
  string: ['minLength', 'maxLength', 'pattern', 'format', 'enum', 'const'],
  number: [
    'minimum',
    'maximum',
    'exclusiveMinimum',
    'exclusiveMaximum',
    'multipleOf',
    'enum',
    'const',
  ],
  integer: [
    'minimum',
    'maximum',
    'exclusiveMinimum',
    'exclusiveMaximum',
    'multipleOf',
    'enum',
    'const',
  ],
  boolean: ['enum', 'const'],
  array: ['minItems', 'maxItems', 'uniqueItems', 'enum', 'const'],
  file: [],
  files: ['minItems', 'maxItems'],
  custom: [],
};

/** The gui `format` names that differ from the JSON Schema format vocabulary. */
const FORMAT_ALIASES: Record<string, string> = { url: 'uri' };

/** Validator types that also name the JSON Schema type of the value they validate. */
const JSON_TYPES = new Set(['string', 'number', 'integer', 'boolean', 'array']);

/**
 * Translates a gui validator object into JSON Schema keywords, the way a tool that describes
 * the form to the outside (for example `@golemui/webmcp`) needs them.
 *
 * `required` is reported separately because JSON Schema expresses it on the parent object.
 * A `file` validator yields no keywords: the upload envelope's shape belongs to the widget.
 * An `array` validator's `items` validator is translated recursively.
 *
 * @param validator - A gui validator object. Anything else yields `undefined`.
 * @example
 * validatorToJsonSchema({ type: 'string', required: true, minLength: 3, format: 'url' });
 * // { schema: { type: 'string', minLength: 3, format: 'uri' }, required: true }
 */
export function validatorToJsonSchema(validator: unknown): ValidatorSchema | undefined {
  if (validator === null || typeof validator !== 'object') {
    return undefined;
  }
  const source = validator as Partial<Validator> & Record<string, unknown>;
  const type = source['type'];
  if (typeof type !== 'string' || !(type in KEYWORDS_BY_TYPE)) {
    return undefined;
  }

  const schema: JsonSchemaFragment = {};
  if (JSON_TYPES.has(type)) {
    schema['type'] = type;
  }
  for (const keyword of KEYWORDS_BY_TYPE[type]) {
    const value = source[keyword];
    if (value === undefined) {
      continue;
    }
    schema[keyword] =
      keyword === 'format' && typeof value === 'string' ? (FORMAT_ALIASES[value] ?? value) : value;
  }
  if (type === 'array' && source['items'] !== undefined) {
    const items = validatorToJsonSchema(source['items']);
    if (items !== undefined) {
      schema['items'] = items.schema;
    }
  }

  return { schema, required: source['required'] === true };
}
