import type { FormEvent, FormSubmitEvent } from '@golemui/core';
import { describe, expect, it } from 'vitest';
import { runFill, runRead } from './execute';
import { buildFormSchema } from './schema';
import { createHarness, signupForm } from './spec-support/harness';
import type { WebmcpOptions } from './types';

const options: WebmcpOptions = { name: 'signup', description: 'Create an account' };

function setup(data: Record<string, unknown> = {}, formDef: Record<string, unknown> = signupForm) {
  const harness = createHarness(formDef, data);
  const schema = buildFormSchema(harness.context.store.getState(), harness.pluginContext, options);
  const events: FormEvent[] = [];
  const submits: FormSubmitEvent[] = [];
  harness.context.events$.subscribe((event) => events.push(event));
  harness.context.submit$.subscribe((event) => submits.push(event));
  return { ...harness, schema, events, submits };
}

describe('fill', () => {
  it('writes the accepted values in one SET_DATA and reports the state', () => {
    const { pluginContext, schema, context } = setup({ interests: ['forms'] });

    const result = runFill(
      pluginContext,
      schema,
      { user: { email: 'ada@example.com' }, seats: '3', registerMode: 'yes' },
      false,
    );

    expect(result.status).toBe('filled');
    expect(context.store.getState().data).toEqual({
      user: { email: 'ada@example.com' },
      seats: 3,
      registerMode: true,
      interests: ['forms'],
    });
    expect(result.values).toEqual({
      user: { email: 'ada@example.com' },
      seats: 3,
      registerMode: true,
      interests: ['forms'],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual({ 'user.password': ['required'], plan: ['required'] });
  });

  it('emits a change for every written visible widget, so on.change handlers run', () => {
    const { pluginContext, schema, events } = setup();
    runFill(pluginContext, schema, { plan: 'team', seats: 2 }, false);
    expect(events.map((event) => event.name)).toEqual(['planChanged']);
  });

  it('maps a choice label to its value, case-insensitively', () => {
    const { pluginContext, schema, context } = setup();
    const result = runFill(pluginContext, schema, { plan: 'team PLAN' }, false);
    expect(result.errors?.['plan']).toBeUndefined();
    expect(context.store.getState().data['plan']).toBe('team');
  });

  it('rejects an unknown choice with the accepted labels and leaves the field alone', () => {
    const { pluginContext, schema, context } = setup({ plan: 'free' });
    const result = runFill(pluginContext, schema, { plan: 'gold' }, false);
    expect(result.errors?.['plan']).toEqual(['Unknown option "gold". Accepted: Free, Team plan']);
    expect(result.isValid).toBe(false);
    expect(context.store.getState().data['plan']).toBe('free');
  });

  it('rejects a value of the wrong type', () => {
    const { pluginContext, schema } = setup();
    const result = runFill(pluginContext, schema, { seats: 'many' }, false);
    expect(result.errors?.['seats']).toEqual(['Expected number']);
  });

  it('never writes sensitive, non-writable or unknown keys, and reports the unknown ones', () => {
    const { pluginContext, schema, context } = setup();
    const result = runFill(
      pluginContext,
      schema,
      {
        user: { password: 'hunter22', email: 'a@b.co', nickname: 'ada' },
        avatar: { id: 'x' },
        ['__proto__']: { polluted: true },
        extra: 1,
      },
      false,
    );
    const data = context.store.getState().data;
    expect(data['user']).toEqual({ email: 'a@b.co' });
    expect(data['avatar']).toBeUndefined();
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
    expect(result.ignored).toEqual([
      'user.password',
      'user.nickname',
      'avatar',
      '__proto__',
      'extra',
    ]);
  });

  it('writes repeater rows through the template fields', () => {
    const { pluginContext, schema, context } = setup();
    const result = runFill(
      pluginContext,
      schema,
      { members: [{ name: 'Ada', age: '36', role: 'lead' }, { name: 'Grace' }] },
      false,
    );
    expect(context.store.getState().data['members']).toEqual([
      { name: 'Ada', age: 36 },
      { name: 'Grace' },
    ]);
    expect(result.errors?.['members']).toBeUndefined();
  });

  it('rejects a repeater row that is not an object', () => {
    const { pluginContext, schema } = setup();
    const result = runFill(pluginContext, schema, { members: ['Ada'] }, false);
    expect(result.errors?.['members']).toEqual(['Each row must be an object']);
  });

  it('reports written fields that the form hides after the write', () => {
    const { pluginContext, schema } = setup({ registerMode: false });
    const hiddenWrite = runFill(pluginContext, schema, { company: 'ACME' }, false);
    expect(hiddenWrite.notVisible).toEqual(['company']);
    expect(hiddenWrite.values?.['company']).toBeUndefined();

    // One call can flip the state and fill the field it reveals.
    const revealed = runFill(pluginContext, schema, { registerMode: true, company: 'ACME' }, false);
    expect(revealed.notVisible).toBeUndefined();
    expect(revealed.values?.['company']).toBe('ACME');
  });

  it('redacts sensitive values and strips upload responses from the reported values', () => {
    const { pluginContext, schema } = setup({
      user: { password: 'hunter22' },
      avatar: { id: 'f1', name: 'me.png', status: 'uploaded', data: { url: 'https://cdn/x' } },
    });
    const result = runRead(pluginContext, schema);
    expect(result.values?.['user']).toEqual({ password: '[redacted]' });
    expect(result.values?.['avatar']).toEqual({ id: 'f1', name: 'me.png', status: 'uploaded' });
  });

  it('refuses a non-object input as an error', () => {
    const { pluginContext, schema } = setup();
    expect(runFill(pluginContext, schema, 'ada', false).status).toBe('error');
    expect(runFill(pluginContext, schema, [1], false).status).toBe('error');
    expect(runFill(pluginContext, schema, undefined, false).status).toBe('filled');
  });

  it('reports an errored form instead of touching it', () => {
    const { pluginContext, schema, context } = setup();
    context.store.dispatch({
      type: 'SET_FORM_HEALTH',
      payload: { formHealth: { status: 'errored', code: 999, message: 'broken' } },
    });
    const result = runFill(pluginContext, schema, { seats: 1 }, false);
    expect(result).toEqual({ status: 'error', message: 'The form is not operational: broken' });
  });
});

describe('submit', () => {
  it('submits when the form validates and reports the submitted values', () => {
    const { pluginContext, schema, submits } = setup({ user: { password: 'longenough' } });
    const result = runFill(
      pluginContext,
      schema,
      { user: { email: 'ada@example.com' }, plan: 'free' },
      true,
    );
    expect(result.status).toBe('submitted');
    expect(result.isValid).toBe(true);
    expect(submits).toHaveLength(1);
    expect(submits[0].data).toEqual({
      user: { email: 'ada@example.com', password: 'longenough' },
      plan: 'free',
    });
    expect(result.values?.['user']).toEqual({ email: 'ada@example.com', password: '[redacted]' });
  });

  it('refuses to submit an invalid form and reports every error', () => {
    const { pluginContext, schema, submits, context } = setup();
    const result = runFill(pluginContext, schema, { plan: 'free' }, true);
    expect(result.status).toBe('invalid');
    expect(result.errors).toEqual({ 'user.email': ['required'], 'user.password': ['required'] });
    expect(submits).toHaveLength(0);
    // The submit attempt touched the form, so the errors now show in the UI.
    expect(context.store.getState().touched).toBe(true);
  });

  it('refuses to submit when a value was rejected, even if the rest validates', () => {
    const { pluginContext, schema, submits } = setup({
      user: { email: 'ada@example.com', password: 'longenough' },
      plan: 'free',
    });
    const result = runFill(pluginContext, schema, { plan: 'gold' }, true);
    expect(result.status).toBe('invalid');
    expect(result.errors?.['plan']?.[0]).toContain('Unknown option');
    expect(submits).toHaveLength(0);
  });
});

describe('read', () => {
  it('reports the values, the validity and the hidden fields without dispatching', () => {
    const { pluginContext, schema, context } = setup({ registerMode: false, seats: 0 });
    const before = context.store.getState();
    const result = runRead(pluginContext, schema);

    expect(result.status).toBe('read');
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual({
      'user.email': ['required'],
      'user.password': ['required'],
      plan: ['required'],
      seats: ['at least 1'],
    });
    expect(result.hidden).toEqual(['company']);
    expect(result.values).toEqual({ registerMode: false, seats: 0 });
    expect(context.store.getState()).toBe(before);
  });

  it('leaves out values that exceed the size cap', () => {
    const { pluginContext, schema } = setup({ interests: ['x'.repeat(70_000)] });
    const result = runRead(pluginContext, schema);
    expect(result.values).toEqual({});
    expect(result.valuesTruncated).toBe(true);
  });
});
