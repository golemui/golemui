/**
 * Builds the schemas behind every validator that `errors.ts` uses, and names the generated module
 * of each one. Only the validator generator imports this module, so none of it is in the runtime
 * bundle. The runtime reads the generated modules instead (see `generated/`).
 *
 * Why derived schemas exist: the form schema's `oneOf` over every widget type produces about 30
 * errors for one typo. Picking the intended widget branch from the widget's own `kind` and `type`
 * and validating only against that branch gives one clean error. Children and templates are
 * validated separately by recursing into them, one widget at a time.
 */

import {
  ALL_SCHEMAS,
  COMMON_SCHEMA,
  COMPONENT_SCHEMAS,
  CUSTOM_SCHEMA,
  FORM_SCHEMA,
  LAYOUT_WIDGET_SCHEMA,
  VALIDATORS_SCHEMA,
  WIDGETS_SCHEMA,
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
  range: 'rangeValidator',
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
  /**
   * Path of the generated module, relative to the generated directory and without extension
   * (for example `shallow/textinput`). The module exports the validator as `validate`.
   */
  modulePath: string;
  /** `$id` the generator's Ajv instance finds the validator by. */
  schemaId: string;
  /** Schema to register first. Absent when the schema is already in `ALL_SCHEMAS`. */
  derivedSchema?: Record<string, unknown>;
};

export type StandaloneValidatorPlan = {
  specs: StandaloneValidatorSpec[];
  rootModulePath: string;
  chunkRefModulePath: string;
  /** Widget `type` -> module path. */
  shallowModulePathByWidgetType: Record<string, string>;
  /** Validator `type` -> module path. Keeps the key order of {@link VALIDATOR_TYPE_TO_DEF}. */
  branchModulePathByValidatorType: Record<string, string>;
  /** Custom widget `kind` -> module path. Keeps the key order of {@link CUSTOM_KIND_TO_DEF}. */
  customModulePathByKind: Record<string, string>;
};

/**
 * Lists every validator to generate, with the derived schema each one needs. The whole-form
 * validator is not in the plan: the runtime checks the root with {@link makeRootSchema} and every
 * widget on its own. Tests generate the whole-form validator separately to compare both.
 * @param formSchema - The form schema the root validator is derived from.
 * @returns The specs for the generator and the lookup tables for the generated modules.
 */
export function planStandaloneValidators(formSchema: WidgetSchema): StandaloneValidatorPlan {
  const specs: StandaloneValidatorSpec[] = [];

  const rootModulePath = 'root';
  const rootSchemaId = `${DERIVED_SCHEMA_ID_BASE}root.json`;
  specs.push({
    modulePath: rootModulePath,
    schemaId: rootSchemaId,
    derivedSchema: { ...makeRootSchema(formSchema), $id: rootSchemaId },
  });

  const chunkRefModulePath = 'chunk-ref';
  const chunkRefSchemaId = `${DERIVED_SCHEMA_ID_BASE}chunk-ref.json`;
  specs.push({
    modulePath: chunkRefModulePath,
    schemaId: chunkRefSchemaId,
    derivedSchema: { $id: chunkRefSchemaId, $ref: `${COMMON_SCHEMA.$id}#/$defs/chunkRef` },
  });

  const shallowModulePathByWidgetType: Record<string, string> = {};
  for (const [widgetType, schema] of Object.entries(COMPONENT_SCHEMAS)) {
    const modulePath = `shallow/${widgetType}`;
    const schemaId = `${DERIVED_SCHEMA_ID_BASE}shallow/${widgetType}.json`;
    shallowModulePathByWidgetType[widgetType] = modulePath;
    specs.push({
      modulePath,
      schemaId,
      derivedSchema: { ...makeShallow(schema, schema.$id), $id: schemaId },
    });
  }

  const branchModulePathByValidatorType: Record<string, string> = {};
  const modulePathByDefinitionKey = new Map<string, string>();
  for (const [validatorType, definitionKey] of Object.entries(VALIDATOR_TYPE_TO_DEF)) {
    let modulePath = modulePathByDefinitionKey.get(definitionKey);
    if (modulePath === undefined) {
      modulePath = `branch/${definitionKey}`;
      const schemaId = `${DERIVED_SCHEMA_ID_BASE}validator-branch/${definitionKey}.json`;
      modulePathByDefinitionKey.set(definitionKey, modulePath);
      specs.push({
        modulePath,
        schemaId,
        derivedSchema: { ...makeValidatorBranchSchema(definitionKey), $id: schemaId },
      });
    }
    branchModulePathByValidatorType[validatorType] = modulePath;
  }

  const customModulePathByKind: Record<string, string> = {};
  for (const [kind, definitionKey] of Object.entries(CUSTOM_KIND_TO_DEF)) {
    const modulePath = `custom/${kind}`;
    const schemaId = `${DERIVED_SCHEMA_ID_BASE}custom-kind/${kind}.json`;
    customModulePathByKind[kind] = modulePath;
    specs.push({
      modulePath,
      schemaId,
      derivedSchema: { ...makeCustomKindSchema(definitionKey), $id: schemaId },
    });
  }

  return {
    specs,
    rootModulePath,
    chunkRefModulePath,
    shallowModulePathByWidgetType,
    branchModulePathByValidatorType,
    customModulePathByKind,
  };
}

/**
 * The form schema with the items of `form` accepted as they are. It checks the root keys,
 * `states` and the shape of `form`. Every widget is checked on its own by the walk in `errors.ts`.
 */
function makeRootSchema(formSchema: WidgetSchema): Record<string, unknown> {
  const cloned = JSON.parse(JSON.stringify(formSchema)) as Record<string, unknown>;
  rewriteRefs(cloned, formSchema.$id);
  delete cloned['$id'];
  const form = (cloned['properties'] as Record<string, Record<string, unknown>> | undefined)?.[
    'form'
  ];
  if (!form || !('items' in form)) {
    throw new Error('form.schema.json has no `properties.form.items` to loosen');
  }
  form['items'] = {};
  return cloned;
}

/**
 * What the walk in `errors.ts` needs to know about the schemas, generated into a small module so
 * the runtime never imports the schemas themselves.
 */
export type ValidatorMetadata = {
  /** Every widget type with a component schema, mapped to its `kind` const. */
  widgetKindByType: Record<string, string | null>;
  /** Built-in types with no component schema (e.g. `renderer`), rejected in a JSON form. */
  schemalessWidgetTypes: string[];
  /** Widget types a repeater `template` (and each `template.<state>`) can be. */
  templateWidgetTypes: string[];
  /** Validator `type` values that have a branch validator, in the order messages list them. */
  validatorTypes: string[];
  /** Custom widget `kind` values that have a validator. */
  customWidgetKinds: string[];
};

/**
 * Derives the metadata of the walk from the schemas, and checks that widgets appear only where
 * the walk applies a position rule (see {@link assertWidgetPositions}).
 */
export function planValidatorMetadata(): ValidatorMetadata {
  const widgetKindByType: Record<string, string | null> = {};
  for (const [widgetType, schema] of Object.entries(COMPONENT_SCHEMAS)) {
    const kind = (schema.properties?.['kind'] as { const?: unknown } | undefined)?.const;
    widgetKindByType[widgetType] = typeof kind === 'string' ? kind : null;
  }
  const knownWidgetTypes =
    (WIDGETS_SCHEMA['$defs'] as Record<string, { enum?: string[] }> | undefined)?.[
      'knownWidgetTypes'
    ]?.enum ?? [];
  assertWidgetPositions();
  return {
    widgetKindByType,
    schemalessWidgetTypes: knownWidgetTypes.filter((type) => !COMPONENT_SCHEMAS[type]),
    templateWidgetTypes: unionMembers(LAYOUT_WIDGET_SCHEMA['oneOf'], LAYOUT_WIDGET_SCHEMA.$id).map(
      (schemaId) => widgetTypeOfSchema(schemaId),
    ),
    validatorTypes: Object.keys(VALIDATOR_TYPE_TO_DEF),
    customWidgetKinds: Object.keys(CUSTOM_KIND_TO_DEF),
  };
}

const WIDGET_UNION_ID = `${WIDGETS_SCHEMA.$id}#/$defs/formWidget`;

/**
 * Where a widget can appear, as `<schema $id>#<JSON pointer of the $ref>`, and which union it
 * references there. The walk in `errors.ts` implements one rule per entry:
 *   - the root `form`, the `children` of every built-in layout and of a custom layout accept any
 *     widget (the full union: every built-in, a custom widget and a chunk reference);
 *   - a repeater template (`props.template` and `props["template.<state>"]`, both through
 *     `$defs/templateProp`) accepts only the built-in layouts.
 */
function expectedWidgetPositions(): Map<string, string> {
  const positions = new Map<string, string>();
  positions.set(`${FORM_SCHEMA.$id}#/properties/form/items`, WIDGET_UNION_ID);
  for (const schema of Object.values(COMPONENT_SCHEMAS)) {
    if ((schema.properties?.['children'] as { items?: unknown } | undefined)?.items) {
      positions.set(`${schema.$id}#/properties/children/items`, WIDGET_UNION_ID);
    }
  }
  positions.set(
    `${CUSTOM_SCHEMA.$id}#/$defs/customLayout/properties/children/items`,
    WIDGET_UNION_ID,
  );
  const repeater = COMPONENT_SCHEMAS['repeater'];
  if (repeater) {
    positions.set(`${repeater.$id}#/$defs/templateProp`, LAYOUT_WIDGET_SCHEMA.$id);
    positions.set(
      `${repeater.$id}#/properties/props/properties/template`,
      `${repeater.$id}#/$defs/templateProp`,
    );
    positions.set(
      `${repeater.$id}#/properties/props/patternProperties/^template\\.[^.]+$`,
      `${repeater.$id}#/$defs/templateProp`,
    );
  }
  return positions;
}

/**
 * Fails the generator when the schemas let a widget appear somewhere the walk does not know, or
 * when the unions stop being what the position rules assume. Without the whole-form validator, a
 * new position would otherwise go unchecked.
 */
function assertWidgetPositions(): void {
  const expected = expectedWidgetPositions();
  const templatePropIds = new Set(
    [...expected.values()].filter((target) => target.endsWith('#/$defs/templateProp')),
  );
  const widgetTargets = new Set([
    WIDGET_UNION_ID,
    LAYOUT_WIDGET_SCHEMA.$id,
    ...templatePropIds,
    ...Object.values(COMPONENT_SCHEMAS).map((schema) => schema.$id),
    CUSTOM_SCHEMA.$id,
  ]);
  const unions = new Set([WIDGETS_SCHEMA.$id, LAYOUT_WIDGET_SCHEMA.$id]);
  const found = new Map<string, string>();
  for (const schema of ALL_SCHEMAS) {
    if (unions.has(schema.$id)) continue;
    collectRefs(schema, '', (pointer, reference) => {
      const target = resolveRef(reference, schema.$id);
      if (widgetTargets.has(target)) found.set(`${schema.$id}#${pointer}`, target);
    });
  }
  const problems: string[] = [];
  for (const [location, target] of found) {
    if (expected.get(location) !== target) {
      problems.push(`${location} references ${target}, which the walk has no position rule for`);
    }
  }
  for (const [location, target] of expected) {
    if (found.get(location) !== target) {
      problems.push(`${location} no longer references ${target}`);
    }
  }
  // The rules for the root and `children` accept every widget, so the union must hold every
  // built-in, the custom fallback and the chunk reference.
  const widgetUnion = unionMembers(
    (WIDGETS_SCHEMA['$defs'] as Record<string, { oneOf?: unknown }>)['formWidget']?.oneOf,
    WIDGETS_SCHEMA.$id,
  );
  const expectedUnion = [
    ...Object.values(COMPONENT_SCHEMAS).map((schema) => schema.$id),
    CUSTOM_SCHEMA.$id,
    `${COMMON_SCHEMA.$id}#/$defs/chunkRef`,
  ];
  if ([...widgetUnion].sort().join() !== [...expectedUnion].sort().join()) {
    problems.push(`${WIDGET_UNION_ID} is no longer every built-in, custom widget and chunk ref`);
  }
  if (problems.length > 0) {
    throw new Error(
      `The position rules of the form validator are out of date:\n  ${problems.join('\n  ')}\n` +
        'Update the position rules in libs/gui/mcp/src/json/errors.ts and ' +
        '`expectedWidgetPositions` in validator-schemas.ts.',
    );
  }
}

/** The `$id`s (or absolute refs) a `oneOf` of `$ref`s points to. */
function unionMembers(oneOf: unknown, baseId: string): string[] {
  if (!Array.isArray(oneOf)) {
    throw new Error(`${baseId} has no oneOf of widget schemas`);
  }
  return oneOf.map((member) => {
    const reference = (member as { $ref?: unknown }).$ref;
    if (typeof reference !== 'string') {
      throw new Error(`${baseId} has a oneOf member that is not a $ref`);
    }
    return resolveRef(reference, baseId);
  });
}

function widgetTypeOfSchema(schemaId: string): string {
  for (const [widgetType, schema] of Object.entries(COMPONENT_SCHEMAS)) {
    if (schema.$id === schemaId) return widgetType;
  }
  throw new Error(`${schemaId} is not a component schema`);
}

/** Resolves a `$ref` against its schema's `$id`, dropping an empty fragment. */
function resolveRef(reference: string, baseId: string): string {
  const resolved = reference.startsWith('#')
    ? `${baseId}${reference}`
    : new URL(reference, baseId).href;
  return resolved.endsWith('#') ? resolved.slice(0, -1) : resolved;
}

function collectRefs(
  node: unknown,
  pointer: string,
  visit: (pointer: string, reference: string) => void,
): void {
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((item, index) => collectRefs(item, `${pointer}/${index}`, visit));
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === '$ref' && typeof value === 'string') {
      visit(pointer, value);
    } else {
      collectRefs(value, `${pointer}/${key}`, visit);
    }
  }
}

// Keywords that only annotate a schema. Validation ignores them, and so do the errors the walk
// formats, but with ajv's `verbose` option every schema object the validators reach is copied into
// the generated code, so their text would be in every module.
const ANNOTATION_KEYWORDS = new Set(['description', 'title', '$comment', 'examples', 'deprecated']);
// Keywords whose value is a map of subschemas, and keywords whose value is a subschema or an
// array of subschemas. Any other keyword's value is data (`enum`, `const`, `required`, ...).
const SCHEMA_MAP_KEYWORDS = new Set([
  'properties',
  'patternProperties',
  '$defs',
  'definitions',
  'dependentSchemas',
]);
const SUBSCHEMA_KEYWORDS = new Set([
  'items',
  'prefixItems',
  'additionalItems',
  'unevaluatedItems',
  'contains',
  'additionalProperties',
  'unevaluatedProperties',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
  'allOf',
  'anyOf',
  'oneOf',
]);

/**
 * Returns a deep copy of a schema without its annotations (`description`, `title`, `$comment`,
 * `examples`, `deprecated`). A property *named* like an annotation (a widget's `title` prop) is
 * kept: only keyword positions are stripped.
 */
export function stripAnnotations<T>(schema: T): T {
  const visit = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(visit);
    if (node === null || typeof node !== 'object') return node;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
      if (ANNOTATION_KEYWORDS.has(key)) continue;
      if (SCHEMA_MAP_KEYWORDS.has(key) && value !== null && typeof value === 'object') {
        result[key] = Object.fromEntries(
          Object.entries(value).map(([name, subschema]) => [name, visit(subschema)]),
        );
      } else if (SUBSCHEMA_KEYWORDS.has(key)) {
        result[key] = visit(value);
      } else {
        result[key] = JSON.parse(JSON.stringify(value)) as unknown;
      }
    }
    return result;
  };
  return visit(schema) as T;
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
    layoutProperties['children'] = loosenChildren(layoutProperties['children']);
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
 * Keeps every constraint of a `children` array (its type, `minItems`) except the schema of its
 * items. Each child is checked on its own by the walk, which also applies the position rules.
 */
function loosenChildren(children: unknown): Record<string, unknown> {
  const { items: _items, prefixItems: _prefixItems, ...rest } = children as Record<string, unknown>;
  return rest;
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
 *   - recursive widget content loosened: `children` keeps its own constraints but not the schema
 *     of its items, and `props.template` and its state variants (`props["template.<state>"]`)
 *     become `{ type: 'object' }`
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
    properties['children'] = loosenChildren(properties['children']);
  }
  if (properties['validator']) {
    // Validators have their own oneOf, which produces its own noise. They are validated
    // separately against the branch picked from `validator.type`.
    properties['validator'] = { type: 'object' };
  }
  loosenValidatorPatternProperties(
    cloned['patternProperties'] as Record<string, unknown> | undefined,
  );
  const propsField = properties['props'] as
    | { properties?: Record<string, unknown>; patternProperties?: Record<string, unknown> }
    | undefined;
  if (propsField?.properties?.['template']) {
    propsField.properties['template'] = { type: 'object' };
  }
  // The state variants of the template (`template.<state>`) reference the same widget union. Left
  // as they are, the repeater validator would contain the validators of every widget.
  for (const key of Object.keys(propsField?.patternProperties ?? {})) {
    if (key.startsWith('^template\\.')) {
      propsField!.patternProperties![key] = { type: 'object' };
    }
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
