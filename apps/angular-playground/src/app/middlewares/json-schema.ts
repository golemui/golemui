export type RefResolver = (ref: string) => JSONSchemaObject;

export function isJsonSchema(json: Record<string, any>): json is JSONSchemaObject {
  const JSON_SCHEMA_STARTS_WITH_URL = 'https://json-schema.org/draft';
  return (
    json['$schema'] !== undefined &&
    (json['$schema'] as string).startsWith(JSON_SCHEMA_STARTS_WITH_URL)
  );
}

/**
 * JSON Schema Draft 2020-12
 */
export interface JSONSchemaObject {
  // Core vocabulary
  $schema?: string;
  $id?: string;
  $ref?: string;
  $defs?: Record<string, JSONSchemaObject>;
  $comment?: string;
  $vocabulary?: Record<string, boolean>;
  $dynamicRef?: string;
  $dynamicAnchor?: string;
  $anchor?: string;

  // Metadata annotations
  title?: string;
  description?: string;
  default?: unknown;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  examples?: unknown[];

  // Validation - Type
  type?: JSONSchemaType | JSONSchemaType[];
  enum?: unknown[];
  const?: unknown;

  // Validation - Numbers
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  minimum?: number;
  exclusiveMinimum?: number;

  // Validation - Strings
  maxLength?: number;
  minLength?: number;
  pattern?: string;

  // Validation - Arrays
  prefixItems?: JSONSchemaObject[];
  items?: JSONSchemaObject;
  contains?: JSONSchemaObject;
  maxContains?: number;
  minContains?: number;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;

  // Validation - Objects
  properties?: Record<string, JSONSchemaObject>;
  patternProperties?: Record<string, JSONSchemaObject>;
  additionalProperties?: JSONSchemaObject;
  propertyNames?: JSONSchemaObject;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  dependentRequired?: Record<string, string[]>;

  // Applicators
  allOf?: JSONSchemaObject[];
  anyOf?: JSONSchemaObject[];
  oneOf?: JSONSchemaObject[];
  not?: JSONSchemaObject;
  if?: JSONSchemaObject;
  then?: JSONSchemaObject;
  else?: JSONSchemaObject;
  dependentSchemas?: Record<string, JSONSchemaObject>;

  // Unevaluated locations
  unevaluatedItems?: JSONSchemaObject;
  unevaluatedProperties?: JSONSchemaObject;

  // Format annotation
  format?: string;

  // Content vocabulary
  contentEncoding?: string;
  contentMediaType?: string;
  contentSchema?: JSONSchemaObject;
}

export type JSONSchemaType =
  | 'null'
  | 'boolean'
  | 'object'
  | 'array'
  | 'number'
  | 'integer'
  | 'string';
