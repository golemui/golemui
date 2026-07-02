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
