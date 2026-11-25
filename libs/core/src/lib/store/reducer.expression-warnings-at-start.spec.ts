import { type StandardSchemaV1 } from '@standard-schema/spec';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator } from '../i18n';
import { enableDevMode } from '../utils/dev-mode';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

/**
 * When the dev mode warning of a state expression or of a condition is printed: one time, when
 * the form starts. The warning is for an expression that only the `strict` policy rejects.
 *
 * Dev mode cannot be turned off, so the first test runs before it is turned on, and this file is
 * separate from the other reducer specs.
 *
 * Run: npx vitest run --config libs/core/vite.config.ts src/lib/store/reducer.expression-warnings-at-start.spec.ts
 */

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

/** The tests validate no input, so the validator accepts every value. */
const validators: ValidatorFn<unknown> = (): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'reducer-spec',
    validate: (value: unknown) => ({ value }),
  },
});

const reduce = reducer({
  validators,
  validateOn: 'eager',
  localization: identityTranslator('en-US'),
  functions: {},
  expressionPolicy: 'warn',
});

const initialize = (formDef: unknown): Action => ({
  type: 'INITIALIZE',
  payload: { formName: 'test-form', formDef: formDef as Record<string, unknown> },
});

const setData = (data: Record<string, unknown>): Action => ({
  type: 'SET_DATA',
  payload: { data },
});

const drive = (actions: Action[]): State => actions.reduce(reduce, createInitialState('en-US'));

// `padEnd` is a method outside the allowed list: it runs with the `warn` policy.
const conditionWithWarning = (field: string): string => `$form.${field}.padEnd(4, '-') === 'ab--'`;

const warningStart = (expression: string): string =>
  `[GolemUI] Expression "${expression}" fails with expressionPolicy 'strict': The method "padEnd" is not in the list of allowed methods:`;

const heading = (uid: string, more: Record<string, unknown>) => ({
  uid,
  kind: 'display',
  type: 'heading',
  ...more,
});

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('reducer: expression warnings when the form starts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints no warning while dev mode is off', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const state = drive([
      initialize({ form: [heading('hint', { include: { when: conditionWithWarning('off') } })] }),
      setData({ off: 'ab' }),
    ]);

    expect(state.widgetFlags['hint']).toEqual({ hidden: false });
    expect(warn).not.toHaveBeenCalled();
  });

  it('prints the warning of a condition at INITIALIZE, before any data', () => {
    enableDevMode();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const condition = conditionWithWarning('code');

    drive([initialize({ form: [heading('hint', { include: { when: condition } })] })]);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(warningStart(condition));
  });

  it.each(['include', 'exclude', 'disabled', 'readonly'])(
    'prints the warning of a %s condition',
    (field) => {
      enableDevMode();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const condition = conditionWithWarning(field);

      drive([
        initialize({
          form: [
            {
              uid: 'name',
              kind: 'input',
              type: 'textinput',
              path: 'name',
              [field]: { when: condition },
            },
          ],
        }),
      ]);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain(warningStart(condition));
    },
  );

  it('prints one warning for a condition that several widgets have', () => {
    enableDevMode();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const condition = conditionWithWarning('shared');

    drive([
      initialize({
        form: [
          heading('first', { include: { when: condition } }),
          heading('second', { exclude: { when: condition } }),
        ],
      }),
      setData({ shared: 'ab' }),
    ]);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('prints one warning for a condition of a row layout, for all the rows', () => {
    enableDevMode();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const condition = "$form.users.items.name.padEnd(4, '-') === 'ab--'";

    const state = drive([
      initialize({
        form: [
          {
            uid: 'users',
            kind: 'input',
            type: 'repeater',
            path: 'users',
            props: {
              template: {
                uid: 'row',
                kind: 'layout',
                type: 'flex',
                children: [heading('badge', { include: { when: condition } })],
              },
            },
          },
        ],
      }),
      setData({ users: [{ name: 'ab' }, { name: 'abc' }, { name: 'ab' }] }),
    ]);

    expect(state.formHealth).toEqual({ status: 'ok' });
    expect(state.widgetFlags['badge[0]']).toEqual({ hidden: false });
    expect(state.widgetFlags['badge[1]']).toEqual({ hidden: true });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(warningStart(condition));
  });

  it('prints the warning of a state expression, with the conditions of its parent states', () => {
    enableDevMode();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const state = drive([
      initialize({
        states: {
          company: '$form.kind === "company"',
          'company:padded': conditionWithWarning('vat'),
        },
        form: [heading('hint', { include: { in: ['company:padded'] } })],
      }),
      setData({ kind: 'company', vat: 'ab' }),
    ]);

    expect(state.currentStates).toEqual(['company', 'company:padded']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(
      warningStart(`($form.kind === "company") && (${conditionWithWarning('vat')})`),
    );
  });

  it('prints the warnings again when the form gets a definition again', () => {
    enableDevMode();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const formDef = {
      form: [heading('hint', { include: { when: conditionWithWarning('again') } })],
    };

    drive([initialize(formDef), initialize(formDef)]);

    expect(warn).toHaveBeenCalledTimes(2);
  });
});
