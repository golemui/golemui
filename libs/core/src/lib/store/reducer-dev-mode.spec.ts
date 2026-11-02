import { type StandardSchemaV1 } from '@standard-schema/spec';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { identityTranslator } from '../i18n';
import { enableDevMode } from '../utils/dev-mode';
import { type Action } from './actions';
import { createInitialState, type State } from './model';
import { reducer } from './reducer';

const requiredValidators = (): StandardSchemaV1 => ({
  '~standard': {
    version: 1,
    vendor: 'reducer-dev-mode-spec',
    validate: (value: unknown) =>
      value === undefined ? { issues: [{ message: 'required' }] } : { value },
  },
});

const drive = (actions: Action[]): State =>
  actions.reduce(
    reducer({
      validators: requiredValidators,
      validateOn: 'eager',
      localization: identityTranslator('en-US'),
      functions: {},
    }),
    createInitialState('en-US'),
  );

const formWithInclude = (includeWhen: string): Action => ({
  type: 'INITIALIZE',
  payload: {
    formName: 'test-form',
    formDef: {
      form: [
        {
          uid: 'name',
          kind: 'input',
          type: 'textinput',
          path: 'name',
          validator: { required: true },
          include: { when: includeWhen },
        },
      ],
    },
  },
});

const setData: Action = { type: 'SET_DATA', payload: { data: {} } };
const blurName: Action = {
  type: 'ATTEMPT_VALIDATION',
  payload: { reason: 'blur', path: 'name', uid: 'name' },
};

// Dev mode cannot be turned off, so this file is separate from the main reducer spec.
describe('reducer in dev mode', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns when the conditions of a form have no stable result', () => {
    enableDevMode();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    drive([formWithInclude('!$formIsInvalid'), setData, blurName]);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no stable result'));
  });

  it('does not warn when the conditions do not read the validation variables', () => {
    enableDevMode();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    drive([formWithInclude('$form.hidden !== true'), setData, blurName]);

    expect(warn).not.toHaveBeenCalled();
  });
});
