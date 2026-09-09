import { FormContext, identityTranslator, type ValidatorFn } from '@golemui/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { webmcp } from './plugin';
import {
  createFakeModelContext,
  createHarness,
  type FakeModelContext,
  signupForm,
  testValueSchemas,
  validators,
} from './spec-support/harness';
import type { WebmcpOptions } from './types';

/** Lets the registration debounce elapse and the registration chain settle. */
async function settle(): Promise<void> {
  await vi.advanceTimersByTimeAsync(150);
}

const baseOptions = (fake: FakeModelContext): WebmcpOptions => ({
  name: 'signup',
  description: 'Create an account',
  modelContext: fake,
});

/** Every context a test attached plugins to, detached after the test so no name claim leaks. */
let attached: FormContext<unknown>[] = [];
const attach = (context: FormContext<unknown>, options: WebmcpOptions) => {
  attached.push(context);
  context.attachPlugins([webmcp(options)]);
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  attached.forEach((context) => context.detachPlugins());
  attached = [];
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('webmcp(options)', () => {
  it('rejects an invalid name or a missing description up front', () => {
    expect(() => webmcp({ name: 'bad name', description: 'x' })).toThrow(TypeError);
    expect(() => webmcp({ name: 'ok', description: '' })).toThrow(/description/);
    expect(() =>
      webmcp({ name: 'ok', description: 'x', toolOverrides: { fill: { name: 'no spaces here' } } }),
    ).toThrow(TypeError);
  });

  it('does nothing where there is no model context (a server runtime, a browser without WebMCP)', () => {
    const { pluginContext } = createHarness(signupForm);
    expect(typeof document).toBe('undefined');
    const teardown = webmcp({ name: 'signup', description: 'x' })(pluginContext);
    expect(teardown).toBeUndefined();
  });
});

describe('registration', () => {
  it('registers fill and submit once the form has derived, not before', async () => {
    const fake = createFakeModelContext();
    const context = new FormContext<unknown>();
    context.initialize(
      {} as never,
      [],
      validators as ValidatorFn<any>,
      'eager',
      {},
      identityTranslator('en-US'),
      {},
      {},
      testValueSchemas,
    );
    context.store.dispatch({
      type: 'INITIALIZE',
      payload: { formName: 'f', formDef: signupForm },
    });
    attach(context, baseOptions(fake));
    await settle();
    expect(fake.tools.size).toBe(0);

    context.store.dispatch({ type: 'SET_DATA', payload: { data: {} } });
    await settle();
    expect([...fake.tools.keys()]).toEqual(['signup-fill', 'signup-submit']);

    const submit = fake.tools.get('signup-submit')!.tool;
    expect(submit.annotations).toEqual({
      readOnlyHint: false,
      consequentialHint: true,
      untrustedContentHint: true,
    });
    expect(submit.description).toContain('submits immediately');
    expect(submit.inputSchema['type']).toBe('object');
    const fill = fake.tools.get('signup-fill')!.tool;
    expect(fill.annotations?.consequentialHint).toBe(false);
  });

  it('registers read on request with an empty input schema and the read-only hint', async () => {
    const fake = createFakeModelContext();
    const { context } = createHarness(signupForm);
    attach(context, {
      ...baseOptions(fake),
      tools: ['read', 'fill'],
      toolOverrides: { fill: { name: 'fill_the_signup', description: 'Custom text' } },
    });
    await settle();

    expect([...fake.tools.keys()].sort()).toEqual(['fill_the_signup', 'signup-read']);
    const read = fake.tools.get('signup-read')!.tool;
    expect(read.inputSchema).toEqual({ type: 'object', properties: {} });
    expect(read.annotations?.readOnlyHint).toBe(true);
    expect(fake.tools.get('fill_the_signup')!.tool.description).toBe('Custom text');
  });

  it('does not re-register on a data change, but does when the description changes', async () => {
    const fake = createFakeModelContext();
    const { context } = createHarness(signupForm);
    attach(context, baseOptions(fake));
    await settle();
    expect(fake.history).toHaveLength(2);

    context.store.dispatch({ type: 'SET_WIDGET_DATA', payload: { path: 'seats', data: 5 } });
    context.store.dispatch({ type: 'SET_DATA', payload: { data: { registerMode: true } } });
    await settle();
    expect(fake.history).toHaveLength(2);

    context.store.dispatch({
      type: 'OVERRIDE_WIDGET_PROP',
      payload: { path: 'plan', prop: 'options', value: [{ label: 'Enterprise', value: 'ent' }] },
    });
    await settle();
    expect(fake.history).toHaveLength(4);
    expect(fake.tools.size).toBe(2);
    const plan = (fake.tools.get('signup-fill')!.tool.inputSchema['properties'] as any)['plan'];
    expect(plan.oneOf).toEqual([{ const: 'ent', title: 'Enterprise' }]);

    context.store.dispatch({ type: 'SET_LANGUAGE', payload: { lang: 'es-ES' } });
    await settle();
    expect(fake.history).toHaveLength(6);
  });

  it('re-registers when the form definition is replaced on the same store', async () => {
    const fake = createFakeModelContext();
    const { context } = createHarness(signupForm);
    attach(context, baseOptions(fake));
    await settle();

    context.store.dispatch({
      type: 'INITIALIZE',
      payload: {
        formName: 'f',
        formDef: { form: [{ kind: 'input', type: 'textinput', path: 'only', label: 'Only' }] },
      },
    });
    context.store.dispatch({ type: 'SET_DATA', payload: { data: {} } });
    await settle();

    const fill = fake.tools.get('signup-fill')!.tool;
    expect(Object.keys(fill.inputSchema['properties'] as object)).toEqual(['only']);
  });

  it('unregisters on detach and frees the name', async () => {
    const fake = createFakeModelContext();
    const { context } = createHarness(signupForm);
    attach(context, baseOptions(fake));
    await settle();
    expect(fake.tools.size).toBe(2);

    context.detachPlugins();
    await settle();
    expect(fake.tools.size).toBe(0);

    // The same name is available again.
    attach(context, baseOptions(fake));
    await settle();
    expect([...fake.tools.keys()]).toEqual(['signup-fill', 'signup-submit']);
  });

  it('suffixes the name of a second form that claims the same one', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fake = createFakeModelContext();
    const first = createHarness(signupForm);
    const second = createHarness(signupForm);
    attach(first.context, baseOptions(fake));
    attach(second.context, baseOptions(fake));
    await settle();

    expect([...fake.tools.keys()].sort()).toEqual([
      'signup-2-fill',
      'signup-2-submit',
      'signup-fill',
      'signup-submit',
    ]);
  });

  it('warns once about widget types it had to infer', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fake = createFakeModelContext();
    const { context } = createHarness({
      form: [{ kind: 'input', type: 'customdate', path: 'when', label: 'When' }],
    });
    attach(context, baseOptions(fake));
    await settle();
    context.store.dispatch({ type: 'SET_LANGUAGE', payload: { lang: 'fr' } });
    await settle();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('"customdate"');
  });

  it('keeps the form working when the description fails to build', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fake = createFakeModelContext();
    const { context } = createHarness(signupForm);
    attach(context, {
      ...baseOptions(fake),
      fields: {
        textinput: () => {
          throw new Error('boom');
        },
      },
    });
    await settle();

    expect(error).toHaveBeenCalledTimes(1);
    expect(fake.tools.size).toBe(0);
    expect(context.store.getState().formHealth).toEqual({ status: 'ok' });
  });
});

describe('executing through the model context', () => {
  it('fills and submits the form end to end, with a JSON round trip', async () => {
    const fake = createFakeModelContext();
    const { context } = createHarness(signupForm, { user: { password: 'longenough' } });
    const submits: unknown[] = [];
    context.submit$.subscribe((event) => submits.push(event.data));
    attach(context, { ...baseOptions(fake), tools: ['read', 'fill', 'submit'] });
    await settle();

    const filled = (await fake.execute('signup-fill', { plan: 'Team plan' })) as Record<
      string,
      unknown
    >;
    expect(filled['status']).toBe('filled');
    expect(filled['isValid']).toBe(false);

    const submitted = (await fake.execute('signup-submit', {
      user: { email: 'ada@example.com' },
    })) as Record<string, unknown>;
    expect(submitted['status']).toBe('submitted');
    expect(submits).toEqual([
      { user: { email: 'ada@example.com', password: 'longenough' }, plan: 'team' },
    ]);

    const read = (await fake.execute('signup-read')) as Record<string, unknown>;
    expect(read['status']).toBe('read');
    expect(read['isValid']).toBe(true);
  });

  it("accepts the arguments as a JSON string, the way Chrome's preview passes them", async () => {
    const fake = createFakeModelContext();
    const { context } = createHarness(signupForm);
    attach(context, baseOptions(fake));
    await settle();

    const result = (await fake.tools
      .get('signup-fill')!
      .tool.execute('{"seats": 4}', { signal: new AbortController().signal })) as Record<
      string,
      unknown
    >;
    expect(result['status']).toBe('filled');
    expect(context.store.getState().data['seats']).toBe(4);
  });

  it('answers a cancelled call with an error result instead of rejecting', async () => {
    const fake = createFakeModelContext();
    const { context } = createHarness(signupForm);
    attach(context, baseOptions(fake));
    await settle();

    const controller = new AbortController();
    controller.abort();
    const result = await fake.tools
      .get('signup-fill')!
      .tool.execute({}, { signal: controller.signal });
    expect(result).toEqual({ status: 'error', message: 'The call was cancelled.' });
  });
});
