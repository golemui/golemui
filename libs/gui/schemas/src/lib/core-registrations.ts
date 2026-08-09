import commonSchema from './core/common.schema.json';

const GUI_CORE_BASE = 'https://golemui.com/schemas/gui/core/';

/**
 * Extra Ajv registrations for the vendored core schemas. Component refs like
 * `../core/common.schema.json` resolve to gui/core/ retrieval URIs, while the
 * vendored files carry the canonical core `$id`. Ajv throws on a duplicate
 * `$id`, so each schema is also provided as an `$id`-stripped clone keyed by
 * its gui-tree retrieval URI.
 * @returns One `{key, schema}` pair per vendored core schema, for `ajv.addSchema(schema, key)`.
 * @example
 * for (const { key, schema } of guiCoreRegistrations()) {
 *   ajv.addSchema(schema, key);
 * }
 */
export function guiCoreRegistrations(): Array<{ key: string; schema: Record<string, unknown> }> {
  return [commonSchema].map((source) => {
    const schema = structuredClone(source) as Record<string, unknown>;
    const sourceId = String((source as Record<string, unknown>)['$id']);
    const file = sourceId.split('/').pop() as string;
    delete schema['$id'];
    return { key: GUI_CORE_BASE + file, schema };
  });
}
