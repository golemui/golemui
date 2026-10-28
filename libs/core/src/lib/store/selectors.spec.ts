import { type StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { createFormStore } from '../form-store';
import { type ValidatorFn } from '../form-validator';
import { identityTranslator } from '../i18n';
import { type Action } from './actions';
import { type FormHealth } from './model';
import { formHealth } from './selectors';

const acceptEverything: ValidatorFn<unknown> = (): StandardSchemaV1 => ({
  '~standard': { version: 1, vendor: 'selectors-spec', validate: (value) => ({ value }) },
});

const setHealth = (health: FormHealth): Action => ({
  type: 'SET_FORM_HEALTH',
  payload: { formHealth: health },
});

describe('formHealth', () => {
  it('emits the health only when its status, code or message changes', () => {
    const store = createFormStore([], acceptEverything, 'eager', identityTranslator('en-US'));
    const emitted: FormHealth[] = [];
    const subscription = formHealth(store.state$).subscribe((health) => emitted.push(health));

    const ok: FormHealth = { status: 'ok' };
    const noWidget: FormHealth = { status: 'errored', code: 30, message: '[30] no widget a' };
    const otherMessage: FormHealth = { status: 'errored', code: 30, message: '[30] no widget b' };
    const otherCode: FormHealth = { status: 'errored', code: 40, message: '[40] no widget b' };

    store.dispatch({
      type: 'INITIALIZE',
      payload: {
        formName: 'health-form',
        formDef: { form: [{ uid: 'name', kind: 'input', type: 'textinput', path: 'name' }] },
      },
    });
    store.dispatch({ type: 'SET_DATA', payload: { data: { name: 'Joan' } } });
    store.dispatch(setHealth(noWidget));
    store.dispatch({ type: 'SET_DATA', payload: { data: { name: 'Ada' } } });
    store.dispatch(setHealth({ ...noWidget }));
    store.dispatch(setHealth(otherMessage));
    store.dispatch(setHealth(otherCode));
    store.dispatch(setHealth({ status: 'ok' }));
    subscription.unsubscribe();

    expect(emitted).toEqual([ok, noWidget, otherMessage, otherCode, ok]);
  });
});
