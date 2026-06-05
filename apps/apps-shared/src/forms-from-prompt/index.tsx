/**
 * Forms-from-a-prompt core — the shared "forms from a prompt" demo logic.
 * ======================================================================
 * The canned prompt → validated {gui.} pairs (PROMPTS), plus the display helpers
 * (highlightJson / renderPrompt / actionLabel). Both the aiden-demo (bare app on
 * /demos) and the quests-portal (the 8-bit walk) render this exact content, so
 * it lives here once. Like @golemui/demo-engine, these are .tsx/.ts files kept
 * out of apps-shared's .ts-only lib build; consumers reach them via the
 * @golemui/forms-from-prompt-core path alias.
 */
export * from './prompts';
export * from './helpers';
