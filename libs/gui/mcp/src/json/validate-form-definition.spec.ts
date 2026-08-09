import { describe, expect, it } from 'vitest';
import { validateFormDefinition } from './validate-form-definition';

describe('json_validate_form_definition', () => {
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

  // `renderer` is listed in knownWidgetTypes without a component schema, so the published
  // schema rejects it. The validator must report a hard error (not the custom-widget warning,
  // and not a fuzzy match to `repeater`, which is within edit distance).
  it('rejects the schema-less built-in type renderer with kind present', () => {
    const result = validateFormDefinition({
      formDefinition: {
        form: [{ kind: 'display', type: 'renderer' }],
      },
    });
    expect(result.valid).toBe(false);
    const rendererError = result.errors.find((e) => e.path === '/form/0/type');
    expect(rendererError?.message).toMatch(/no JSON representation/);
    expect(rendererError?.suggestion).toMatch(/gui\.displays\.display/);
    expect(result.warnings.filter((w) => w.keyword === 'customWidget')).toEqual([]);
  });

  it('rejects the schema-less built-in type renderer with kind omitted', () => {
    const result = validateFormDefinition({
      formDefinition: {
        form: [{ type: 'renderer' }],
      },
    });
    expect(result.valid).toBe(false);
    const rendererError = result.errors.find((e) => e.path === '/form/0/type');
    expect(rendererError?.message).toMatch(/no JSON representation/);
    expect(result.errors.filter((e) => /repeater/.test(e.message ?? ''))).toEqual([]);
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

  it('flags missing $form/$meta prefix in reactive expressions', () => {
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

  it('accepts $formIsInvalid as a valid root reference', () => {
    const result = validateFormDefinition({
      formDefinition: {
        states: { formInvalid: '$formIsInvalid' },
        form: [
          {
            kind: 'action',
            type: 'button',
            label: 'Submit',
            disabled: { when: '$formIsInvalid' },
          },
        ],
      },
    });
    expect(
      result.expressionWarnings.filter((w) => w.message.includes('does not reference')),
    ).toEqual([]);
  });

  it('does not flag !$formIsInvalid (negation of a boolean is valid)', () => {
    const result = validateFormDefinition({
      formDefinition: {
        form: [
          {
            kind: 'display',
            type: 'alert',
            props: { text: 'Form is valid' },
            include: { when: '!$formIsInvalid' },
          },
        ],
      },
    });
    expect(result.expressionWarnings.filter((w) => w.message.includes('negates'))).toEqual([]);
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

  it('treats unknown widget types far from any built-in as custom widgets (warning, not error)', () => {
    const result = validateFormDefinition({
      formDefinition: {
        form: [
          // `heading` isn't a built-in widget and isn't close to one - must be a custom widget.
          { kind: 'display', type: 'heading', props: { text: 'Hi', level: 2 } } as never,
          // Real built-in alongside it to prove normal validation still runs.
          { kind: 'input', type: 'textinput', path: 'name' },
        ],
      },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]!.keyword).toBe('customWidget');
    expect(result.warnings[0]!.path).toBe('/form/0/type');
    expect(result.warnings[0]!.message).toMatch(/heading/);
  });

  it('still errors (not warns) when a widget type is a clear typo of a built-in', () => {
    const result = validateFormDefinition({
      formDefinition: {
        form: [{ kind: 'input', type: 'textimput', path: 'name' }],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.warnings).toEqual([]);
    expect(result.errors.some((e) => e.suggestion?.includes('textinput'))).toBe(true);
  });

  it('recurses into a custom layout widget to validate its standard children', () => {
    // A custom `wrapper` layout containing a real textinput with a typo: the wrapper itself
    // produces a warning, but the typo inside should still produce an error.
    const result = validateFormDefinition({
      formDefinition: {
        form: [
          {
            kind: 'layout',
            type: 'customWrapper',
            children: [{ kind: 'input', type: 'textimput', path: 'name' }],
          } as never,
        ],
      },
    });
    expect(result.warnings).toHaveLength(1);
    expect(result.errors.some((e) => e.path === '/form/0/children/0/type')).toBe(true);
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

  // ---------------------------------------------------------------------------
  // Defensive-coding rules (R1-R4). Each has a positive case (must flag) and a
  // negative case (must NOT flag).
  // ---------------------------------------------------------------------------

  const formWith = (when: string) => ({
    formDefinition: {
      form: [{ kind: 'input', type: 'textinput', path: 'x', include: { when } }],
    },
  });
  const has = (result: { expressionWarnings: Array<{ message: string }> }, pattern: RegExp) =>
    result.expressionWarnings.some((w) => pattern.test(w.message));

  describe('R1 - loose equality', () => {
    it('flags loose `==`', () => {
      const r = validateFormDefinition(formWith('$form.x == "y"'));
      expect(has(r, /loose equality/)).toBe(true);
    });
    it('flags loose `!=`', () => {
      const r = validateFormDefinition(formWith('$form.x != null'));
      expect(has(r, /loose equality/)).toBe(true);
    });
    it('does not flag strict `===`/`!==`', () => {
      const r = validateFormDefinition(formWith('$form.x === "y" && $form.y !== undefined'));
      expect(has(r, /loose equality/)).toBe(false);
    });
  });

  describe('R2 - negation of reference', () => {
    it('flags `!$form.x`', () => {
      const r = validateFormDefinition(formWith('!$form.x'));
      expect(has(r, /negates a `\$form/)).toBe(true);
    });
    it('flags `! $form.user?.name` (with whitespace, with optional chain)', () => {
      const r = validateFormDefinition(formWith('! $form.user?.name'));
      expect(has(r, /negates a `\$form/)).toBe(true);
    });
    it('does not flag `!==` / `!=` operators', () => {
      const r = validateFormDefinition(formWith('$form.x !== undefined'));
      expect(has(r, /negates a `\$form/)).toBe(false);
    });
  });

  describe('R3 - chained access without optional chaining', () => {
    it('flags `$form.user.name`', () => {
      const r = validateFormDefinition(formWith('$form.user.name === "Joan"'));
      expect(has(r, /optional chaining/)).toBe(true);
    });
    it('flags `$form.a?.b.c` (last hop unsafe)', () => {
      const r = validateFormDefinition(formWith('$form.a?.b.c === 1'));
      expect(has(r, /optional chaining/)).toBe(true);
    });
    it('does not flag fully optional-chained access', () => {
      const r = validateFormDefinition(formWith('$form.user?.name === "Joan"'));
      expect(has(r, /optional chaining/)).toBe(false);
    });
    it('does not flag single-level access `$form.x`', () => {
      const r = validateFormDefinition(formWith('$form.x === 1'));
      expect(has(r, /optional chaining/)).toBe(false);
    });
  });

  describe('R4 - reference as truthy/falsy boolean', () => {
    it('flags a bare reference `$form.x`', () => {
      const r = validateFormDefinition(formWith('$form.x'));
      expect(has(r, /directly as a boolean/)).toBe(true);
    });
    it('flags reference before `&&`', () => {
      const r = validateFormDefinition(formWith('$form.x && $form.y === "z"'));
      expect(has(r, /directly as a boolean/)).toBe(true);
    });
    it('flags reference before ternary `?`', () => {
      const r = validateFormDefinition(formWith('$form.x ? true : false'));
      expect(has(r, /directly as a boolean/)).toBe(true);
    });
    it('flags trailing reference after `||`', () => {
      const r = validateFormDefinition(formWith('$form.x === "z" || $form.y'));
      expect(has(r, /directly as a boolean/)).toBe(true);
    });
    it('does not flag optional chaining `?.` (must not be confused with ternary)', () => {
      const r = validateFormDefinition(formWith('$form.user?.name === "Joan"'));
      expect(has(r, /directly as a boolean/)).toBe(false);
    });
    it('does not flag nullish coalescing `??`', () => {
      const r = validateFormDefinition(formWith('($form.x ?? "default") === "default"'));
      expect(has(r, /directly as a boolean/)).toBe(false);
    });
    it('does not flag a reference used as a comparison RHS', () => {
      const r = validateFormDefinition(formWith('$form.x === $form.y'));
      expect(has(r, /directly as a boolean/)).toBe(false);
    });
    it('does not flag idiomatic length checks', () => {
      const r = validateFormDefinition(formWith('$form.items?.length > 0'));
      expect(has(r, /directly as a boolean/)).toBe(false);
    });
  });

  describe('R5 - comparison/arithmetic on possibly-undefined leaf', () => {
    it('flags `$form.x > 180`', () => {
      const r = validateFormDefinition(formWith('$form.size > 180'));
      expect(has(r, /comparison or arithmetic/)).toBe(true);
    });
    it('flags `$form.user?.age >= 18` even with optional chain (leaf still possibly undefined)', () => {
      const r = validateFormDefinition(formWith('$form.user?.age >= 18'));
      expect(has(r, /comparison or arithmetic/)).toBe(true);
    });
    it('flags arithmetic `$form.x + 1`', () => {
      const r = validateFormDefinition(formWith('$form.x + 1 === 2'));
      expect(has(r, /comparison or arithmetic/)).toBe(true);
    });
    it('does not flag strict equality `===`', () => {
      const r = validateFormDefinition(formWith('$form.x === 180'));
      expect(has(r, /comparison or arithmetic/)).toBe(false);
    });
    it('does not flag nullish coalescing `??`', () => {
      const r = validateFormDefinition(formWith('($form.x ?? 0) > 180'));
      // The ref `$form.x` here is operand of `??`, not `>`. The wrapper `(... ?? 0)` is what's > 180.
      expect(has(r, /comparison or arithmetic/)).toBe(false);
    });
    it('flags `$index > 0` outside a repeater template, not comparison/arithmetic', () => {
      const r = validateFormDefinition(formWith('$index > 0'));
      expect(has(r, /only available inside a repeater/)).toBe(true);
      expect(has(r, /does not reference/)).toBe(false);
      expect(has(r, /comparison or arithmetic/)).toBe(false);
    });
    it('does not flag a guarded comparison', () => {
      const r = validateFormDefinition(formWith('$form.size !== undefined && $form.size > 180'));
      expect(has(r, /comparison or arithmetic/)).toBe(false);
    });
  });

  describe('$item / $index repeater template scope', () => {
    const repeaterFormWith = (when: string, md = '## Row') => ({
      formDefinition: {
        form: [
          {
            kind: 'input',
            type: 'repeater',
            path: 'lineItems',
            props: {
              template: {
                kind: 'layout',
                type: 'flex',
                props: { direction: 'column' },
                children: [
                  {
                    kind: 'display',
                    type: 'markdownText',
                    props: { md },
                    include: { when },
                  },
                ],
              },
            },
          },
        ],
      },
    });

    it('accepts `$item` in a `when` inside a repeater template', () => {
      const r = validateFormDefinition(repeaterFormWith('$item.quantity !== undefined'));
      expect(has(r, /only available inside a repeater/)).toBe(false);
      expect(has(r, /does not reference/)).toBe(false);
    });

    it('accepts `$index` in a `when` inside a repeater template', () => {
      const r = validateFormDefinition(repeaterFormWith('$index === 0'));
      expect(has(r, /only available inside a repeater/)).toBe(false);
      expect(has(r, /does not reference/)).toBe(false);
    });

    it('accepts `$item` in an interpolation slot inside a repeater template', () => {
      const r = validateFormDefinition(
        repeaterFormWith(
          '$item.quantity !== undefined',
          '**Total:** {{(($item.quantity ?? 0) * ($item.unitPrice ?? 0)).toFixed(2)}}',
        ),
      );
      expect(
        r.interpolationWarnings.some((w) => /only available inside a repeater/.test(w.message)),
      ).toBe(false);
      expect(r.interpolationWarnings.some((w) => /does not reference/.test(w.message))).toBe(false);
    });

    it('flags `$item` in a `when` outside a repeater template', () => {
      const r = validateFormDefinition(formWith('$item.quantity !== undefined'));
      expect(has(r, /only available inside a repeater/)).toBe(true);
      expect(has(r, /does not reference/)).toBe(false);
    });

    it('flags `$item` in an interpolation slot outside a repeater template', () => {
      const r = validateFormDefinition({
        formDefinition: {
          form: [
            {
              kind: 'display',
              type: 'markdownText',
              props: { md: '{{$item.quantity}}' },
            },
          ],
        },
      });
      expect(
        r.interpolationWarnings.some((w) => /only available inside a repeater/.test(w.message)),
      ).toBe(true);
    });

    it('flags `$item` in a `states` expression (global scope)', () => {
      const r = validateFormDefinition({
        formDefinition: {
          states: { hasQuantity: '$item.quantity !== undefined' },
          form: [{ kind: 'input', type: 'textinput', path: 'x' }],
        },
      });
      expect(has(r, /only available inside a repeater/)).toBe(true);
    });

    it('applies the defensive rules to `$item` references inside templates', () => {
      const r = validateFormDefinition(repeaterFormWith('!$item.done'));
      expect(has(r, /negates a `\$form/)).toBe(true);
    });
  });

  describe('$fn host function scope', () => {
    it('accepts a pure-$fn `when` expression with no other root reference', () => {
      const r = validateFormDefinition(formWith('$fn.isWeekendPromo()'));
      expect(has(r, /does not reference/)).toBe(false);
    });

    it('accepts $fn combined with $form arguments', () => {
      const r = validateFormDefinition(formWith('$fn.hasItems($form.items)'));
      expect(has(r, /does not reference/)).toBe(false);
    });

    it('accepts a pure-$fn interpolation slot', () => {
      const r = validateFormDefinition({
        formDefinition: {
          form: [
            {
              kind: 'display',
              type: 'markdownText',
              props: { md: '**Total:** {{$fn.grandTotal($form.lineItems)}}' },
            },
          ],
        },
      });
      expect(r.interpolationWarnings.some((w) => /does not reference/.test(w.message))).toBe(false);
    });

    it('accepts a pure-$fn `states` expression', () => {
      const r = validateFormDefinition({
        formDefinition: {
          states: { promo: '$fn.isWeekendPromo()' },
          form: [{ kind: 'input', type: 'textinput', path: 'x' }],
        },
      });
      expect(has(r, /does not reference/)).toBe(false);
    });

    it('still flags a bare identifier without any scope root', () => {
      const r = validateFormDefinition(formWith('isWeekendPromo()'));
      expect(has(r, /does not reference/)).toBe(true);
    });
  });

  it('leaves existing idiomatic safe expressions unflagged', () => {
    // Composite safe expression touching all four new rules.
    const r = validateFormDefinition({
      formDefinition: {
        states: {
          systemMessage: '$meta.systemMessage !== undefined',
          remote: '$form.details?.isRemote === true',
        },
        form: [
          {
            kind: 'input',
            type: 'textinput',
            path: 'name',
            include: { when: '$form.terms === true && $form.user?.name !== undefined' },
          },
        ],
      },
    });
    expect(r.expressionWarnings).toEqual([]);
  });

  describe('boolean validator semantics (the mandatory-checkbox trap)', () => {
    const booleanWarnings = (r: ReturnType<typeof validateFormDefinition>) =>
      r.warnings.filter((w) => w.keyword === 'booleanValidator');

    it('warns on `required: true` without `const` - it does not force the box checked', () => {
      const r = validateFormDefinition({
        formDefinition: {
          form: [
            {
              kind: 'input',
              type: 'checkbox',
              path: 'terms',
              label: 'Accept terms',
              validator: { type: 'boolean', required: true },
            },
          ],
        },
      });
      // Advisory - half a recipe is legal, just rarely intended.
      expect(r.valid).toBe(true);
      const warnings = booleanWarnings(r);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].path).toBe('/form/0/validator');
      expect(warnings[0].message).toMatch(/`false` is a valid boolean/);
      expect(warnings[0].suggestion).toMatch(/`const: true`/);
    });

    it('warns on `const: true` without `required` - the pristine undefined passes', () => {
      const r = validateFormDefinition({
        formDefinition: {
          form: [
            {
              kind: 'input',
              type: 'checkbox',
              path: 'terms',
              validator: { type: 'boolean', const: true },
            },
          ],
        },
      });
      expect(r.valid).toBe(true);
      const warnings = booleanWarnings(r);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toMatch(/pristine value passes/);
      expect(warnings[0].suggestion).toMatch(/`required: true`/);
    });

    it('stays quiet on the full recipe and on non-boolean validators', () => {
      const r = validateFormDefinition({
        formDefinition: {
          form: [
            {
              kind: 'input',
              type: 'checkbox',
              path: 'terms',
              validator: { type: 'boolean', required: true, const: true },
            },
            {
              kind: 'input',
              type: 'textinput',
              path: 'name',
              validator: { type: 'string', required: true },
            },
          ],
        },
      });
      expect(r.valid).toBe(true);
      expect(booleanWarnings(r)).toEqual([]);
    });

    it('finds the trap on widgets nested inside layouts', () => {
      const r = validateFormDefinition({
        formDefinition: {
          form: [
            {
              kind: 'layout',
              type: 'flex',
              props: { direction: 'column' },
              children: [
                {
                  kind: 'input',
                  type: 'checkbox',
                  path: 'terms',
                  validator: { type: 'boolean', required: true },
                },
              ],
            },
          ],
        },
      });
      expect(r.valid).toBe(true);
      const warnings = booleanWarnings(r);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].path).toBe('/form/0/children/0/validator');
    });
  });
});
