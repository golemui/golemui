/**
 * Builds the schemas behind every validator that `errors.ts` uses, and names the generated export
 * of each one. Only the validator generator imports this module, so none of it is in the runtime
 * bundle. The runtime reads the generated validators instead (see `generated/validators.js`).
 *
 * Why derived schemas exist: the form schema's `oneOf` over every widget type produces about 30
 * errors for one typo. Picking the intended widget branch from the widget's own `kind` and `type`
 * and validating only against that branch gives one clean error. Children and templates are
 * validated separately by recursing into them, one widget at a time.
 */

import {
  COMMON_SCHEMA,
  COMPONENT_SCHEMAS,
  CUSTOM_SCHEMA,
  VALIDATORS_SCHEMA,
  type WidgetSchema,
} from './index';

const DERIVED_SCHEMA_ID_BASE = 'https://golemui.com/schemas/gui/mcp/';

/**
 * Map from a validator's `type` field value to its `$defs` key in validators.schema.json.
 * `'integer'` also maps to numberValidator since that branch accepts both. The key order is the
 * order the runtime reports in messages.
 */
export const VALIDATOR_TYPE_TO_DEF: Readonly<Record<string, string>> = {
  string: 'stringValidator',
  number: 'numberValidator',
  integer: 'numberValidator',
  boolean: 'booleanValidator',
  array: 'arrayValidator',
  file: 'fileValidator',
  files: 'filesValidator',
  custom: 'customValidator',
};

/** Map from a custom widget's `kind` value to its `$defs` key in custom.schema.json. */
export const CUSTOM_KIND_TO_DEF: Readonly<Record<string, string>> = {
  input: 'customInput',
  display: 'customDisplay',
  action: 'customAction',
  layout: 'customLayout',
};

export type StandaloneValidatorSpec = {
  /** Name of the export in the generated module. */
  exportName: string;
  /** `$id` the generator's Ajv instance finds the validator by. */
  schemaId: string;
  /** Schema to register first. Absent when the schema is already in `ALL_SCHEMAS`. */
  derivedSchema?: Record<string, unknown>;
};

export type StandaloneValidatorPlan = {
  specs: StandaloneValidatorSpec[];
  formExportName: string;
  chunkRefExportName: string;
  /** Widget `type` -> export name. */
  shallowExportNameByWidgetType: Record<string, string>;
  /** Validator `type` -> export name. Keeps the key order of {@link VALIDATOR_TYPE_TO_DEF}. */
  branchExportNameByValidatorType: Record<string, string>;
  /** Custom widget `kind` -> export name. Keeps the key order of {@link CUSTOM_KIND_TO_DEF}. */
  customExportNameByKind: Record<string, string>;
};

/**
 * Lists every validator to generate, with the derived schema each one needs.
 * @param formSchema - The form schema, validated as is.
 * @returns The specs for the generator and the lookup tables for the generated module.
 */
export function planStandaloneValidators(formSchema: WidgetSchema): StandaloneValidatorPlan {
  const specs: StandaloneValidatorSpec[] = [];

  const formExportName = 'formValidator';
  specs.push({ exportName: formExportName, schemaId: formSchema.$id });

  const chunkRefExportName = 'chunkRefValidator';
  const chunkRefSchemaId = `${DERIVED_SCHEMA_ID_BASE}chunk-ref.json`;
  specs.push({
    exportName: chunkRefExportName,
    schemaId: chunkRefSchemaId,
    derivedSchema: { $id: chunkRefSchemaId, $ref: `${COMMON_SCHEMA.$id}#/$defs/chunkRef` },
  });

  const shallowExportNameByWidgetType: Record<string, string> = {};
  for (const [widgetType, schema] of Object.entries(COMPONENT_SCHEMAS)) {
    const exportName = `shallowWidget_${widgetType}`;
    const schemaId = `${DERIVED_SCHEMA_ID_BASE}shallow/${widgetType}.json`;
    shallowExportNameByWidgetType[widgetType] = exportName;
    specs.push({
      exportName,
      schemaId,
      derivedSchema: { ...makeShallow(schema, schema.$id), $id: schemaId },
    });
  }

  const branchExportNameByValidatorType: Record<string, string> = {};
  const exportNameByDefinitionKey = new Map<string, string>();
  for (const [validatorType, definitionKey] of Object.entries(VALIDATOR_TYPE_TO_DEF)) {
    let exportName = exportNameByDefinitionKey.get(definitionKey);
    if (exportName === undefined) {
      exportName = `validatorBranch_${definitionKey}`;
      const schemaId = `${DERIVED_SCHEMA_ID_BASE}validator-branch/${definitionKey}.json`;
      exportNameByDefinitionKey.set(definitionKey, exportName);
      specs.push({
        exportName,
        schemaId,
        derivedSchema: { ...makeValidatorBranchSchema(definitionKey), $id: schemaId },
      });
    }
    branchExportNameByValidatorType[validatorType] = exportName;
  }

  const customExportNameByKind: Record<string, string> = {};
  for (const [kind, definitionKey] of Object.entries(CUSTOM_KIND_TO_DEF)) {
    const exportName = `customWidget_${kind}`;
    const schemaId = `${DERIVED_SCHEMA_ID_BASE}custom-kind/${kind}.json`;
    customExportNameByKind[kind] = exportName;
    specs.push({
      exportName,
      schemaId,
      derivedSchema: { ...makeCustomKindSchema(definitionKey), $id: schemaId },
    });
  }

  return {
    specs,
    formExportName,
    chunkRefExportName,
    shallowExportNameByWidgetType,
    branchExportNameByValidatorType,
    customExportNameByKind,
  };
}

/**
 * Bundles the whole `$defs` map alongside one validator branch so its internal `#/$defs/...` refs
 * still resolve on their own. Cross-file refs are rewritten to absolute URLs that match the
 * registered validators schema.
 */
function makeValidatorBranchSchema(definitionKey: string): Record<string, unknown> {
  const definitions =
    (VALIDATORS_SCHEMA as unknown as { $defs?: Record<string, unknown> }).$defs ?? {};
  const branch = definitions[definitionKey];
  if (!branch) {
    throw new Error(`validators.schema.json has no $defs entry named "${definitionKey}"`);
  }
  const cloned = {
    ...(JSON.parse(JSON.stringify(branch)) as Record<string, unknown>),
    $defs: JSON.parse(JSON.stringify(definitions)) as Record<string, unknown>,
  };
  rewriteRefs(cloned, VALIDATORS_SCHEMA.$id);
  return cloned;
}

/**
 * Keeps the `allOf` (baseWidget and the built-in type exclusion) and `unevaluatedProperties` of
 * the custom schema, and replaces the kind `oneOf` with the single matching branch, moved into
 * the `allOf`. A failure then reports the branch's own error instead of a bare "does not match any
 * allowed variant". Nested content is loosened the same way {@link makeShallow} loosens it.
 */
function makeCustomKindSchema(definitionKey: string): Record<string, unknown> {
  const cloned = JSON.parse(JSON.stringify(CUSTOM_SCHEMA)) as Record<string, unknown>;
  rewriteRefs(cloned, CUSTOM_SCHEMA.$id);
  delete cloned['$id'];
  delete cloned['oneOf'];
  cloned['allOf'] = [
    ...((cloned['allOf'] as unknown[] | undefined) ?? []),
    { $ref: `#/$defs/${definitionKey}` },
  ];
  loosenNestedContent(cloned['$defs'] as Record<string, unknown> | undefined);
  return cloned;
}

/**
 * Replaces `children` and `validator` in the custom branches with permissive primitives. Both
 * get their own targeted pass at runtime (children by recursion, validators by branch).
 */
function loosenNestedContent(definitions: Record<string, unknown> | undefined): void {
  const layoutProperties = (
    definitions?.['customLayout'] as { properties?: Record<string, unknown> } | undefined
  )?.properties;
  if (layoutProperties?.['children']) {
    layoutProperties['children'] = { type: 'array' };
  }
  const customInput = definitions?.['customInput'] as
    | { properties?: Record<string, unknown>; patternProperties?: Record<string, unknown> }
    | undefined;
  if (customInput?.properties?.['validator']) {
    customInput.properties['validator'] = { type: 'object' };
  }
  loosenValidatorPatternProperties(customInput?.patternProperties);
}

/**
 * Same treatment for state-scoped validator variants declared via patternProperties (for example
 * `^validator\.[^.]+$`). The pattern still admits the key shape, but the value is validated as a
 * plain object. The per-state validator gets its own targeted pass.
 */
function loosenValidatorPatternProperties(
  patternProperties: Record<string, unknown> | undefined,
): void {
  if (!patternProperties) {
    return;
  }
  for (const key of Object.keys(patternProperties)) {
    if (key.startsWith('^validator\\.')) {
      patternProperties[key] = { type: 'object' };
    }
  }
}

/**
 * Returns a deep clone of `schema` with:
 *   - the `$id` stripped, so the caller sets a new unique one
 *   - all relative `$ref`s rewritten to absolute, since stripping the `$id` loses the base URI
 *   - recursive widget content loosened: `children` becomes `{ type: 'array' }` and
 *     `props.template` becomes `{ type: 'object' }`
 *
 * Anything else is kept as is, so the widget's own props still get validated strictly.
 */
function makeShallow(
  schema: { $id?: string; [key: string]: unknown },
  baseId: string,
): Record<string, unknown> {
  const cloned = JSON.parse(JSON.stringify(schema)) as Record<string, unknown>;
  rewriteRefs(cloned, baseId);
  delete cloned['$id'];

  const properties = (cloned['properties'] as Record<string, unknown> | undefined) ?? {};
  if (properties['children']) {
    properties['children'] = { type: 'array' };
  }
  if (properties['validator']) {
    // Validators have their own oneOf, which produces its own noise. They are validated
    // separately against the branch picked from `validator.type`.
    properties['validator'] = { type: 'object' };
  }
  loosenValidatorPatternProperties(
    cloned['patternProperties'] as Record<string, unknown> | undefined,
  );
  const propsField = properties['props'] as { properties?: Record<string, unknown> } | undefined;
  if (propsField?.properties?.['template']) {
    propsField.properties['template'] = { type: 'object' };
  }
  return cloned;
}

function rewriteRefs(node: unknown, baseId: string): void {
  if (node === null || typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      rewriteRefs(item, baseId);
    }
    return;
  }
  const objectNode = node as Record<string, unknown>;
  if (typeof objectNode['$ref'] === 'string') {
    const reference = objectNode['$ref'];
    // Absolute and same-document refs stay as they are.
    if (!reference.startsWith('http') && !reference.startsWith('#')) {
      try {
        objectNode['$ref'] = new URL(reference, baseId).href;
      } catch {
        // An unparsable ref stays as it is and fails when the schema is compiled.
      }
    }
  }
  for (const value of Object.values(objectNode)) {
    rewriteRefs(value, baseId);
  }
}
