import { describe, expect, it } from 'vitest';
import { validateFormDefinition } from './validate-form-definition';

describe('validate_form_definition', () => {
  it('accepts a minimal valid textinput form', () => {
    const result = validateFormDefinition({
      formDefinition: {
        form: [
          {
            kind: 'input',
            type: 'textinput',
            path: 'firstName',
          },
        ],
      },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts a form with multiple widget kinds, validator, and conditional', () => {
    const result = validateFormDefinition({
      formDefinition: {
        states: { agreed: '$form.terms === true' },
        form: [
          {
            kind: 'input',
            type: 'textinput',
            path: 'email',
            label: 'Email',
            validator: { type: 'string', required: true, format: 'email' },
          },
          {
            kind: 'input',
            type: 'checkbox',
            path: 'terms',
            label: 'Accept terms',
            validator: { type: 'boolean', required: true, const: true },
          },
          {
            kind: 'action',
            type: 'button',
            label: 'Submit',
            include: { when: '$form.terms === true' },
            on: { click: 'submit' },
          },
        ],
      },
    });
    expect(result.valid).toBe(true);
  });

  it('rejects an unknown property at root', () => {
    const result = validateFormDefinition({
      formDefinition: {
        form: [{ kind: 'input', type: 'textinput', path: 'x' }],
        unknownProp: 'oops',
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /Unknown property/.test(e.message))).toBe(true);
  });

  it('rejects an invalid widget type with a suggestion', () => {
    const result = validateFormDefinition({
      formDefinition: {
        form: [{ kind: 'input', type: 'textimput', path: 'x' }],
      },
    });
    expect(result.valid).toBe(false);
    const typoError = result.errors.find((e) => e.path.endsWith('/type'));
    expect(typoError).toBeDefined();
    expect(typoError?.suggestion).toMatch(/textinput/);
  });

  it('rejects an invalid validator format', () => {
    const result = validateFormDefinition({
      formDefinition: {
        form: [
          {
            kind: 'input',
            type: 'textinput',
            path: 'email',
            validator: { type: 'string', format: 'mail' },
          },
        ],
      },
    });
    expect(result.valid).toBe(false);
    const formatError = result.errors.find((e) => e.path.endsWith('/validator/format'));
    expect(formatError).toBeDefined();
    expect(formatError?.suggestion).toMatch(/email/);
  });

  it('flags missing $form/$meta/$item/$index prefix in reactive expressions', () => {
    const result = validateFormDefinition({
      formDefinition: {
        form: [
          {
            kind: 'input',
            type: 'textinput',
            path: 'name',
            include: { when: 'firstName === "John"' },
          },
        ],
      },
    });
    // Schema-valid (it's a string), but the linter should catch it.
    expect(result.expressionWarnings.length).toBeGreaterThan(0);
    expect(result.expressionWarnings[0]!.message).toMatch(/\$form/);
  });

  it('never returns valid=false with an empty errors list', () => {
    // Failsafe: if ajv rejects the form but our collapser swallows all the errors (a known
    // failure mode when a widget is accepted in isolation but rejected by formWidget oneOf at
    // its position), we must still surface *something* the caller can act on.
    // We simulate it by validating a known top-level-disallowed shape (an unknown layout type).
    const result = validateFormDefinition({
      formDefinition: {
        form: [{ kind: 'unknown_kind', type: 'unknown_type', path: 'x' } as never],
      },
    });
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('accepts $meta.* references in reactive expressions', () => {
    const result = validateFormDefinition({
      formDefinition: {
        states: {
          systemMessage: '$meta.systemMessage !== undefined',
          offline: '$meta.connectionStatus !== "online"',
        },
        form: [{ kind: 'input', type: 'textinput', path: 'name' }],
      },
    });
    expect(result.expressionWarnings).toEqual([]);
  });

  it('flags single = in reactive expressions', () => {
    const result = validateFormDefinition({
      formDefinition: {
        form: [
          {
            kind: 'input',
            type: 'textinput',
            path: 'name',
            include: { when: '$form.foo = "bar"' },
          },
        ],
      },
    });
    expect(result.expressionWarnings.some((w) => /===/.test(w.suggestion ?? ''))).toBe(true);
  });

  it('collapses oneOf branch noise for a single-letter widget-type typo', () => {
    const result = validateFormDefinition({
      formDefinition: {
        form: [
          { kind: 'input', type: 'textinput', path: 'name' },
          { kind: 'action', type: 'buton', label: 'Submit', on: { click: 'submit' } },
        ],
      },
    });
    expect(result.valid).toBe(false);
    // Before collapsing this surfaced ~30 errors; now we expect a handful, all pointing at the
    // matching (button) branch.
    expect(result.errors.length).toBeLessThan(5);
    const typeErr = result.errors.find((e) => e.path === '/form/1/type');
    expect(typeErr).toBeDefined();
    expect(typeErr?.suggestion).toMatch(/button/);
    // No error should come from a non-matching branch (e.g. allowedValue: 'accordion').
    const fromOtherBranches = result.errors.filter(
      (e) =>
        e.path === '/form/1/type' &&
        e.keyword === 'const' &&
        (e.params as { allowedValue?: string } | undefined)?.allowedValue !== 'button',
    );
    expect(fromOtherBranches).toEqual([]);
  });

  it('collapses oneOf noise for a layout widget missing a required field', () => {
    // A `grid` with no `children` previously surfaced ~100 errors including spurious accordion
    // hints like "Missing required property `sections`". Should now collapse to one clean error.
    const result = validateFormDefinition({
      formDefinition: {
        form: [{ kind: 'layout', type: 'grid', props: { columnGap: 12 } }],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.path).toBe('/form/0');
    expect(result.errors[0]!.message).toMatch(/Missing required property `children`/);
  });

  it('collapses validator oneOf noise for an invalid format', () => {
    const result = validateFormDefinition({
      formDefinition: {
        form: [
          {
            kind: 'input',
            type: 'textinput',
            path: 'email',
            validator: { type: 'string', format: 'mail' },
          },
        ],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.path).toBe('/form/0/validator/format');
    expect(result.errors[0]!.suggestion).toMatch(/email/);
  });

  it('finds typos in deeply nested children', () => {
    const result = validateFormDefinition({
      formDefinition: {
        form: [
          {
            kind: 'layout',
            type: 'flex',
            props: { direction: 'column' },
            children: [{ kind: 'input', type: 'textimput', path: 'name' }],
          },
        ],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.path).toBe('/form/0/children/0/type');
    expect(result.errors[0]!.suggestion).toMatch(/textinput/);
  });

  it('flags unbalanced parens in reactive expressions', () => {
    const result = validateFormDefinition({
      formDefinition: {
        form: [
          {
            kind: 'input',
            type: 'textinput',
            path: 'name',
            include: { when: '($form.foo === "bar"' },
          },
        ],
      },
    });
    expect(result.expressionWarnings.some((w) => /Unclosed/.test(w.message))).toBe(true);
  });
});
