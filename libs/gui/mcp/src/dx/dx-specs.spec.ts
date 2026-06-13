import { describe, expect, it } from 'vitest';
import { DX_SPECS, dxPatterns, listDxFactories } from './dx-specs';
import { typeCheckDx } from './typecheck';

/**
 * The anti-fragility guarantee: every example we ship in the DX grounding registry
 * must type-check against the real @golemui declarations. A hand-written reference
 * is unreliable (the arena scar) — so the compiler, not inspection, gates it here.
 */
describe('dx-specs registry', () => {
  it('has at least the core signup factories', () => {
    for (const f of [
      'textInput',
      'dropdown',
      'radiogroup',
      'datePicker',
      'booleanInput',
      'button',
    ]) {
      expect(listDxFactories()).toContain(f);
    }
  });

  it.each(listDxFactories())(
    'example for "%s" compiles against real @golemui types',
    async (factory) => {
      const { example } = DX_SPECS[factory];
      const result = await typeCheckDx(`[ ${example} ]`);
      if (!result.ok) {
        // eslint-disable-next-line no-console
        console.error(factory, JSON.stringify(result.diagnostics, null, 2));
      }
      expect(result.ok).toBe(true);
    },
  );

  it.each(dxPatterns())('pattern "$name" compiles against real @golemui types', async (pattern) => {
    const result = await typeCheckDx(`[ ${pattern.example} ]`);
    expect(result.diagnostics).toEqual([]);
    expect(result.ok).toBe(true);
  });

  // The arena's blank-render scar: `{ states, form: [...] }` as `formDef` compiles but renders
  // nothing. The grounding teaches the real shape — form-level `states` live in `formConfig`,
  // `formDef` stays the bare array. Pin that shape against the real `GuiFormInitConfig` type so the
  // teaching can't drift from the engine.
  it('form-level states go in formConfig.states with a bare-array formDef', async () => {
    const result = await typeCheckDx(
      `import { gui, type GuiFormInitConfig } from '@golemui/gui-shared';\n` +
        `const form = [\n` +
        `  gui.inputs.dropdown('coverageType', { label: 'Coverage', items: [{ value: 'family', label: 'Family' }], validator: { type: 'string', required: true } }),\n` +
        `  gui.inputs.textInput('spouseName', { label: 'Spouse name', include: { in: ['familyCoverage'] } }),\n` +
        `];\n` +
        `const config: GuiFormInitConfig = {\n` +
        `  formDef: form,\n` +
        `  formConfig: { states: { familyCoverage: "$form.coverageType === 'family'" }, validateOn: 'blur' },\n` +
        `};\n` +
        `void config;\n`,
    );
    if (!result.ok) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.ok).toBe(true);
  });

  it('the assembled multi-field form compiles', async () => {
    const items = ['textInput', 'dropdown', 'radiogroup', 'datePicker', 'booleanInput', 'button']
      .map((f) => DX_SPECS[f].example)
      .join(',\n  ');
    const result = await typeCheckDx(`export const form = [\n  ${items}\n];`);
    if (!result.ok) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.ok).toBe(true);
  });
});
