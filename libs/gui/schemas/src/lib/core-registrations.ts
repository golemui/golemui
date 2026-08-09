import commonSchema from './core/common.schema.json';
import validatorsSchema from './core/validators.schema.json';

const GUI_CORE_BASE = 'https://golemui.com/schemas/gui/core/';

/**
 * Extra Ajv registrations for the vendored core schemas.
 *
 * Component schemas reference the vendored copies with relative refs like
 * `../core/common.schema.json`. Resolved against a component `$id`
 * (`https://golemui.com/schemas/gui/components/...`) that yields the retrieval
 * URI `https://golemui.com/schemas/gui/core/common.schema.json`, while the
 * vendored files declare the canonical core `$id`
 * (`https://golemui.com/schemas/core/common.schema.json`, byte-identical to the
 * `@golemui/schemas` source). Ajv resolves refs by registered id only, and
 * registering the same `$id` twice throws, so each vendored schema is
 * registered a second time as an `$id`-stripped clone under its gui-tree
 * retrieval URI. A keyed schema without `$id` uses its key as base URI, which
 * also resolves the validators-to-common ref between the two clones.
 *
 * @returns One `{key, schema}` pair per vendored core schema, for
 * `ajv.addSchema(schema, key)`.
 * @example
 * for (const { key, schema } of guiCoreRegistrations()) {
 *   if (!ajv.getSchema(key)) {
 *     ajv.addSchema(schema, key);
 *   }
 * }
 */
export function guiCoreRegistrations(): Array<{ key: string; schema: Record<string, unknown> }> {
  return [commonSchema, validatorsSchema].map((source) => {
    const schema = structuredClone(source) as Record<string, unknown>;
    const sourceId = String((source as Record<string, unknown>)['$id']);
    const file = sourceId.split('/').pop() as string;
    delete schema['$id'];
    return { key: GUI_CORE_BASE + file, schema };
  });
}
