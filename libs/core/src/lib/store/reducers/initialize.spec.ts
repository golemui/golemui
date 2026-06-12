import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorCodes } from '../../errors';
import { createInitialState } from '../model';
import { initialize } from './initialize';

// The arena's blank-render scar: a form built with the gui.* helpers but passed in the wrong shape
// (`{ states, form: [...] }` straight to formDef) type-checks but renders blank with no signal,
// because the gui.* items (`type: 'ITEMS'`) never get resolved. The reducer must catch unresolved
// items and fail loud with a self-fixing message instead of producing an empty form.
describe('initialize — unresolved gui.* items guard', () => {
  const dxItem = (itemType: string) => ({ type: 'ITEMS', itemType });
  const init = (formDef: string | Record<string, any>) =>
    initialize(createInitialState('en-US'), {
      type: 'INITIALIZE',
      payload: { formName: 'f', formDef },
    });

  it('errors when a `{ states, form: [gui.* items] }` object is passed as formDef', () => {
    const result = init({ states: { x: '$form.a === true' }, form: [dxItem('textInput')] });
    expect(result.formHealth.status).toBe('errored');
    expect(result.formHealth).toMatchObject({ code: errorCodes.initializeMalformedFormShapeError });
    // The message must tell the user what to do.
    if (result.formHealth.status === 'errored') {
      expect(result.formHealth.message).toContain('formConfig');
      expect(result.formHealth.message).toContain('Do NOT wrap');
    }
  });

  it('errors when `form` is a single unresolved gui.* item', () => {
    const result = init({ form: dxItem('textInput') });
    expect(result.formHealth.status).toBe('errored');
    expect(result.formHealth).toMatchObject({ code: errorCodes.initializeMalformedFormShapeError });
  });

  it('does NOT fire for a normal core formDef (bare-array form, no ITEMS)', () => {
    const result = init({
      form: [{ uid: 'name', kind: 'input', type: 'text', path: 'name' }],
    });
    expect(result.formHealth.status).toBe('ok');
  });
});

describe('initialize — undeclared state reference diagnostic', () => {
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
    // Still a usable form — this is a dev diagnostic, not a form-breaking error.
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
