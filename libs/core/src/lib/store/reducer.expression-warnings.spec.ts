import { type StandardSchemaV1 } from '@standard-schema/spec';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator } from '../i18n';
import { ALLOWED_EXPRESSION_METHODS } from '../utils/check-expression';
import { enableDevMode } from '../utils/dev-mode';
import { type Action } from './actions';
import { createInitialState } from './model';
import { reducer } from './reducer';

/**
 * The dev mode warning for an expression that only the `strict` policy rejects, checked through
 * the reducer: the test sends `INITIALIZE` and `SET_DATA`, and reads the `console.warn` calls and
 * the state that results.
 *
 * Dev mode cannot be turned off, so this file is separate from the other reducer specs.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.expression-warnings.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

/** The test does not validate an input, so the validator accepts every value. */
const validators: ValidatorFn<unknown> = (): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'reducer-spec',
    validate: (value: unknown) => ({ value }),
  },
});

const setData = (data: Record<string, unknown>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer: expression warnings in dev mode', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints one warning for a condition that calls a method outside the allowed list, and runs it', () => {
    // A text that was compiled before prints no warning, so no other test uses this text.
    const condition = "$form.code.padEnd(4, '-') === 'ab--'";
    enableDevMode();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const reduce = reducer({
      validators,
      validateOn: 'eager',
      localization: identityTranslator('en-US'),
      functions: {},
      expressionPolicy: 'warn',
    });
    const initialize: Action = {
      type: 'INITIALIZE',
      payload: {
        formName: 'test-form',
        formDef: {
          form: [
            {
              kind: 'display',
              uid: 'codeHint',
              type: 'heading',
              include: { when: condition },
            },
          ],
        },
      },
    };

    const initialized = reduce(createInitialState('en-US'), initialize);
    const afterFirstData = reduce(initialized, setData({ code: 'ab' }));
    const afterSecondData = reduce(afterFirstData, setData({ code: 'abc' }));

    expect(afterSecondData.formHealth).toEqual({ status: 'ok' });
    // 'ab' gives 'ab--' and 'abc' gives 'abc-', so the condition ran on each data.
    expect(afterFirstData.widgetFlags['codeHint']).toEqual({ hidden: false });
    expect(afterSecondData.widgetFlags['codeHint']).toEqual({ hidden: true });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      `[GolemUI] Expression "${condition}" fails with expressionPolicy 'strict': The method "padEnd" is not in the list of allowed methods: ${ALLOWED_EXPRESSION_METHODS.join(', ')}.`,
    );
  });
});
