/**
 * Forms-as-data core — the shared "forms as data" demo logic.
 * ===========================================================
 * The generic schema→{gui.} mapper (deriveFormDefinition / deriveFormDsl), the
 * mock backend endpoints, and the record-builder + JSON-highlight helpers. Both
 * the sasha-demo (bare app on /demos) and the quests-portal (the 8-bit walk)
 * edit the same response shapes and render the same derived form, so it lives
 * here once. Like @golemui/demo-engine, these are .tsx/.ts files kept out of
 * apps-shared's .ts-only lib build; consumers reach them via the
 * @golemui/forms-as-data-core path alias.
 */
export * from './deriveFormDefinition';
export * from './endpoints';
export * from './helpers';
