import type { SchemaNode } from '@golemui/schemas/json-schema';

// `date`, `date-time` and `time` are left out: the date and time widgets write their own value
// format, which a strict format check could reject.
const CHECKED_FORMATS = new Set(['email', 'hostname', 'ipv4', 'ipv6', 'url', 'uuid', 'duration']);
// JSON Schema format names that the gui validator knows under another name.
const FORMAT_NAMES: Record<string, string> = { uri: 'url' };

const NUMBER_KEYWORDS = [
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
];

/**
 * The gui validator of a schema node, in the shape of the gui `validators.schema.json`, or
 * `undefined` when there is nothing to check. `required` keeps its gui meaning: the value must
 * not be empty.
 *
 * @example
 * // node: { type: 'string', required: true, schema: { format: 'email', maxLength: 80 } }
 * guiValidator(node) // { type: 'string', required: true, maxLength: 80, format: 'email' }
 */
export function guiValidator(node: SchemaNode): Record<string, unknown> | undefined {
  const { schema } = node;
  const constraints: Record<string, unknown> = {};
  const copyNumbers = (keywords: string[]) => {
    for (const keyword of keywords) {
      if (typeof schema[keyword] === 'number') {
        constraints[keyword] = schema[keyword];
      }
    }
  };

  switch (node.type) {
    case 'string': {
      copyNumbers(['minLength', 'maxLength']);
      if (typeof schema['pattern'] === 'string') {
        constraints['pattern'] = schema['pattern'];
      }
      const format =
        typeof schema['format'] === 'string'
          ? (FORMAT_NAMES[schema['format']] ?? schema['format'])
          : undefined;
      if (format !== undefined && CHECKED_FORMATS.has(format)) {
        constraints['format'] = format;
      }
      copyLiterals(schema, constraints, (value) => typeof value === 'string');
      break;
    }
    case 'number':
    case 'integer':
      copyNumbers(NUMBER_KEYWORDS);
      copyLiterals(schema, constraints, (value) => typeof value === 'number');
      break;
    case 'boolean':
      copyLiterals(schema, constraints, (value) => typeof value === 'boolean');
      break;
    case 'array':
      copyNumbers(['minItems', 'maxItems']);
      if (schema['uniqueItems'] === true) {
        constraints['uniqueItems'] = true;
      }
      break;
    default:
      return undefined;
  }

  // A checkbox that must be checked needs both `required` and `const: true`.
  const required = node.required || (node.type === 'boolean' && constraints['const'] === true);
  if (!required && Object.keys(constraints).length === 0) {
    return undefined;
  }
  return { type: node.type, ...(required ? { required: true } : {}), ...constraints };
}

function copyLiterals(
  schema: Record<string, unknown>,
  constraints: Record<string, unknown>,
  hasType: (value: unknown) => boolean,
): void {
  if ('const' in schema && hasType(schema['const'])) {
    constraints['const'] = schema['const'];
  }
  if (Array.isArray(schema['enum'])) {
    const values = schema['enum'].filter(hasType);
    if (values.length > 0) {
      constraints['enum'] = values;
    }
  }
}
