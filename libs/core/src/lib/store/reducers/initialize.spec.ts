import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorCodes } from '../../errors';
import { createInitialState } from '../model';
import { initialize } from './initialize';

// A double-wrapped form `{ form: { states, form: [...] } }` type-checks but the decoder rejects it;
// the reducer must fail with a clear message, not a raw decode dump.
describe('initialize - malformed form shape guard', () => {
  const init = (formDef: string | Record<string, any>) =>
    initialize(createInitialState('en-US'), {
      type: 'INITIALIZE',
      payload: { formName: 'f', formDef },
    });

  it('errors when the form is double-wrapped `{ form: { states, form: [...] } }`', () => {
    const result = init({
      form: {
        states: { x: '$form.a === true' },
        form: [{ uid: 'name', kind: 'input', type: 'text', path: 'name' }],
      },
    });
    expect(result.formHealth.status).toBe('errored');
    expect(result.formHealth).toMatchObject({ code: errorCodes.initializeMalformedFormShapeError });
    if (result.formHealth.status === 'errored') {
      expect(result.formHealth.message).toContain('Do NOT wrap');
    }
  });

  it('does NOT fire for a normal core formDef (bare-array form)', () => {
    const result = init({
      form: [{ uid: 'name', kind: 'input', type: 'text', path: 'name' }],
    });
    expect(result.formHealth.status).toBe('ok');
  });
});

describe('initialize - uid collision guard', () => {
  const init = (formDef: Record<string, any>) =>
    initialize(createInitialState('en-US'), {
      type: 'INITIALIZE',
      payload: { formName: 'f', formDef },
    });

  it('errors with a self-describing message when two widgets share a uid', () => {
    const result = init({
      form: [
        { uid: 'dup', kind: 'input', type: 'text', path: 'a' },
        { uid: 'dup', kind: 'input', type: 'text', path: 'b' },
      ],
    });
    expect(result.formHealth.status).toBe('errored');
    expect(result.formHealth).toMatchObject({ code: errorCodes.initializeUidCollisionError });
    if (result.formHealth.status === 'errored') {
      expect(result.formHealth.message).toContain('Duplicate UID "dup"');
    }
  });
});

describe('initialize - undeclared state reference diagnostic', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => errorSpy.mockRestore());

  const init = (formDef: Record<string, any>) =>
    initialize(createInitialState('en-US'), {
      type: 'INITIALIZE',
      payload: { formName: 'f', formDef },
    });

  it('console.errors when include.in names a state not in formDef.states', () => {
    const result = init({
      states: { showExtra: '$form.a === true' },
      form: [
        {
          uid: 'wrap',
          kind: 'layout',
          type: 'flex',
          include: { in: ['typoState'] }, // not declared
          children: [{ uid: 'x', kind: 'input', type: 'text', path: 'x' }],
        },
      ],
    });
    // Still a usable form - this is a dev diagnostic, not a form-breaking error.
    expect(result.formHealth.status).toBe('ok');
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toContain('typoState');
    expect(errorSpy.mock.calls[0][0]).toContain('showExtra'); // lists what IS declared
  });

  it('stays silent when every include.in / exclude.from state is declared', () => {
    init({
      states: { showExtra: '$form.a === true' },
      form: [
        {
          uid: 'wrap',
          kind: 'layout',
          type: 'flex',
          include: { in: ['showExtra'] },
          children: [{ uid: 'x', kind: 'input', type: 'text', path: 'x' }],
        },
      ],
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

// Re-initializing with an equal form definition (StrictMode double-effect, a re-fetched JSON) must produce the exact same uids,
// otherwise the already rendered widgets point at flags and repeater scopes that no longer exist
describe('initialize - deterministic uids across re-initializes', () => {
  const init = (formDef: Record<string, any>) =>
    initialize(createInitialState('en-US'), {
      type: 'INITIALIZE',
      payload: { formName: 'f', formDef },
    });

  // Bare-array form shape with no explicit uids, so it also exercises the root layout synthesized by the reducer itself
  const makeRawFormDef = (): Record<string, any> =>
    JSON.parse(
      JSON.stringify({
        form: [
          { kind: 'display', type: 'text', props: { text: 'hello' } },
          {
            kind: 'input',
            type: 'repeater',
            path: 'items',
            props: {
              template: {
                kind: 'layout',
                type: 'flex',
                children: [{ kind: 'display', type: 'text', props: { text: 'row' } }],
              },
            },
          },
        ],
      }),
    );

  it('produces identical flatForm uids for two copies of the same definition', () => {
    const firstRun = init(makeRawFormDef());
    const secondRun = init(makeRawFormDef());

    expect(firstRun.formHealth.status).toBe('ok');
    expect(Object.keys(firstRun.flatForm)).toEqual(Object.keys(secondRun.flatForm));
  });

  it('produces identical repeater template uids for two copies of the same definition', () => {
    const collectTemplateUids = (state: ReturnType<typeof init>): string[] => {
      const repeater = state.flatForm['items-repeater'] as Record<string, any>;
      const template = repeater['props']['template'];
      return [template.uid, ...template.children.map((child: any) => child.uid)];
    };

    const firstUids = collectTemplateUids(init(makeRawFormDef()));
    const secondUids = collectTemplateUids(init(makeRawFormDef()));

    expect(firstUids).toEqual(secondUids);
    for (const uid of firstUids) {
      expect(uid).toBeTruthy();
    }
  });

  it('keeps the same uid for a function widget across re-initializes', () => {
    const fnWidget = () => ({
      kind: 'display' as const,
      type: 'text',
      uid: '',
      props: { text: 'from a function' },
    });
    const formDef = { form: [fnWidget] };

    const firstKeys = Object.keys(init(formDef).flatForm);
    const secondKeys = Object.keys(init(formDef).flatForm);

    expect(firstKeys).toEqual(secondKeys);
  });
});

// FunctionWidgetParams contract says ($form is always an object) check that
// `$form.field` reads return undefined, not crash because `$form` is `undefined`.
describe('initialize - function widget decode probe', () => {
  const init = (formDef: Record<string, any>) =>
    initialize(createInitialState('en-US'), {
      type: 'INITIALIZE',
      payload: { formName: 'f', formDef },
    });

  it('decodes a function widget that reads `$form.field` without optional chaining', () => {
    const fnWidget = ({ $form }: any) => ({
      uid: 'agreed',
      kind: 'input' as const,
      type: 'checkbox',
      path: 'agreed',
      label: $form.rtlMode ? 'RTL' : 'LTR',
    });
    const result = init({ form: [fnWidget] });
    expect(result.formHealth.status).toBe('ok');
    expect(result.flatForm['agreed']).toBeDefined();
  });
});
