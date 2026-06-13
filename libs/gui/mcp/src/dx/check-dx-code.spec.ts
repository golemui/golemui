import { describe, expect, it } from 'vitest';
import { checkDxCode } from './check-dx-code';

// A correct, compiling signup form authored with the real gui.* API.
const VALID_FORM = `import { gui } from '@golemui/gui-shared';
export const signupForm = [
  gui.inputs.textInput('fullName', { label: 'Full name', validator: { required: true, minLength: 2 } }),
  gui.inputs.textInput('email', { label: 'Email', validator: { required: true, format: 'email' } }),
  gui.inputs.datePicker('dateOfBirth', { label: 'Date of birth', validator: { required: true } }),
  gui.inputs.dropdown('country', { label: 'Country', validator: { type: 'string', required: true }, items: [{ value: 'us', label: 'US' }] }),
  gui.inputs.radiogroup('accountType', { label: 'Account type', defaultValue: 'personal', options: [{ value: 'personal', label: 'Personal' }, { value: 'business', label: 'Business' }] }),
  gui.inputs.booleanInput('newsletter', { label: 'Subscribe to newsletter', defaultValue: false }),
  gui.actions.button({ label: 'Sign up', actionType: 'submit' }),
];
`;

describe('dx_check_code', () => {
  it('passes a correct gui.* form', async () => {
    const r = await checkDxCode({ code: VALID_FORM });
    if (!r.ok) console.error(JSON.stringify(r.diagnostics, null, 2));
    expect(r.ok).toBe(true);
    expect(r.diagnostics).toHaveLength(0);
  });

  it('accepts a bare array (prepends the gui import)', async () => {
    const r = await checkDxCode({
      code: `[ gui.inputs.textInput('email', { label: 'Email', validator: { required: true } }) ]`,
    });
    expect(r.ok).toBe(true);
  });

  it('catches the dropdown loose-validator wart (TS2769) with a fix hint', async () => {
    const r = await checkDxCode({
      code: `[ gui.inputs.dropdown('country', { label: 'C', validator: { required: true }, items: [{ value: 'us', label: 'US' }] }) ]`,
    });
    expect(r.ok).toBe(false);
    expect(r.diagnostics.some((d) => d.code === 2769)).toBe(true);
    expect(r.diagnostics.some((d) => /typed validator/.test(d.hint ?? ''))).toBe(true);
  });

  it('hints the items↔options asymmetry when a choice widget gets the wrong key', async () => {
    // radiogroup takes `options`, not `items` — the wrong key is an excess property.
    const r = await checkDxCode({
      code: `[ gui.inputs.radiogroup('plan', { label: 'Plan', items: [{ value: 'a', label: 'A' }] }) ]`,
    });
    expect(r.ok).toBe(false);
    expect(
      r.diagnostics.some((d) => /dropdown.*items|radiogroup.*options/.test(d.hint ?? '')),
    ).toBe(true);
  });

  it('hints the display content key when `content` is used instead of `text`/`md`', async () => {
    const r = await checkDxCode({
      code: `[ gui.displays.alert({ content: 'Review your details.' }) ]`,
    });
    expect(r.ok).toBe(false);
    expect(r.diagnostics.some((d) => /uses \*\*`text`\*\*|`md`/.test(d.hint ?? ''))).toBe(true);
  });

  it('catches the removed submitButton with a fix hint', async () => {
    const r = await checkDxCode({
      code: `[ gui.actions.submitButton({ label: 'Go', onClick: () => {} }) ]`,
    });
    expect(r.ok).toBe(false);
    expect(r.diagnostics.some((d) => /actionType: 'submit'/.test(d.hint ?? ''))).toBe(true);
  });

  it('catches the cold hallucination (invented chained builder)', async () => {
    const r = await checkDxCode({
      code: `gui.form('signup').text('name', (f) => f.label('Name')).build();`,
    });
    expect(r.ok).toBe(false);
  });

  it('strips a markdown code fence', async () => {
    const r = await checkDxCode({
      code: "```ts\n[ gui.inputs.textInput('a', { label: 'A' }) ]\n```",
    });
    expect(r.ok).toBe(true);
  });

  it('rejects empty input', async () => {
    await expect(checkDxCode({ code: '   ' })).rejects.toThrow(/non-empty/);
  });

  // The arena "hide when" case: compiles clean, but `include` is on the spread, not in the config.
  it('flags a misplaced `include` on a gui.* spread (compiles, but a silent no-op)', async () => {
    const r = await checkDxCode({
      code: `[
        gui.inputs.booleanInput('hasPromoCode', { label: 'I have a promo code', defaultValue: false }),
        { ...gui.inputs.textInput('promoCode', { label: 'Promo code', validator: { required: true } }), include: { when: '$form.hasPromoCode === true' } },
      ]`,
    });
    expect(r.ok).toBe(false);
    expect(r.diagnostics.some((d) => /silent no-op/.test(d.message))).toBe(true);
    expect(r.diagnostics.some((d) => /INSIDE the factory/.test(d.hint ?? ''))).toBe(true);
  });

  it('accepts the correct inline `include` (inside the config argument)', async () => {
    const r = await checkDxCode({
      code: `[
        gui.inputs.booleanInput('hasPromoCode', { label: 'I have a promo code' }),
        gui.inputs.textInput('promoCode', { label: 'Promo code', include: { when: '$form.hasPromoCode === true' } }),
      ]`,
    });
    if (!r.ok) console.error(JSON.stringify(r.diagnostics, null, 2));
    expect(r.ok).toBe(true);
    expect(r.expressionWarnings).toHaveLength(0);
  });

  it('lints a reactive `when` expression into non-blocking expressionWarnings (shared with the JSON path)', async () => {
    const r = await checkDxCode({
      code: `[ gui.inputs.textInput('promoCode', { label: 'Promo code', include: { when: 'hasPromoCode === true' } }) ]`,
    });
    // Missing `$form` prefix is advisory — it does not flip `ok` (mirrors json_validate_form_definition).
    expect(r.ok).toBe(true);
    expect(r.expressionWarnings.some((w) => /\$form/.test(w.message + (w.suggestion ?? '')))).toBe(
      true,
    );
  });
});
