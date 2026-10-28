import { describe, expect, it } from 'vitest';

/**
 * The runtime exports are listed in full, so adding or removing one shows as a change in this
 * file. Types are not listed because they do not exist at runtime.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/index.spec.ts
 */
describe('@golemui/core entry points', () => {
  it('exports these runtime values from the public entry', async () => {
    const publicEntry = await import('./index');

    expect(Object.keys(publicEntry).sort()).toEqual([
      'FormContext',
      'assertNoPropCollisions',
      'cloneObject',
      'createWidgetViewModelReader',
      'defineForm',
      'devToolsMiddleware',
      'enableDevMode',
      'errorCodes',
      'filterTap',
      'formEventNames',
      'formHealth',
      'getDirectionFromLanguage',
      'identityTranslator',
      'isStandardValidateSuccess',
      'makeRepeaterItemConfig',
      'preloadFormWidgets',
      'shortUUID',
      'standardValidate',
      'widgetViewModel',
      'widgetViewModel$',
    ]);
  });

  it('exports these runtime values from the internals entry', async () => {
    const internalsEntry = await import('./internals');

    expect(Object.keys(internalsEntry).sort()).toEqual([
      'ALLOWED_EXPRESSION_METHODS',
      'EXPRESSION_LIMITS',
      'checkExpression',
      'isI18nParamExpression',
    ]);
  });
});
