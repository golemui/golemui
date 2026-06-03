/**
 * Forms-compose core — the shared "pillar II" composition demo.
 * =============================================================
 * The {gui.} form definition + the on-screen tree + the i18n translator + the
 * custom currency renderer. Both the rob-demo (bare app on /demos) and the
 * quests-portal (the 8-bit walk) render this exact composition, so it lives
 * here once. Like @golemui/demo-engine, these are .tsx files kept out of
 * apps-shared's .ts-only lib build; consumers reach them via the
 * @golemui/forms-compose-core path alias.
 */
export * from './composeForm';
export { CurrencyItemRenderer } from './CurrencyItemRenderer';
