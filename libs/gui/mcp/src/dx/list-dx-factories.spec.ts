import { describe, expect, it } from 'vitest';
import { listDxFactoriesCatalog } from './list-dx-factories';
import { listDxFactories } from './dx-specs';

describe('dx_list_factories', () => {
  it('returns every factory with its namespace and call signature in one payload', () => {
    const cat = listDxFactoriesCatalog();
    // Same coverage as the per-factory registry — the catalog must not omit any factory.
    expect(cat.factories.map((f) => f.factory).sort()).toEqual(listDxFactories());
    for (const f of cat.factories) {
      expect(f.call).toContain(`gui.${f.namespace}.${f.factory}`);
    }
  });

  it('surfaces the real names that get cold-guessed wrong (numberInput, booleanInput)', () => {
    const names = listDxFactoriesCatalog().factories.map((f) => f.factory);
    // The arena agent guessed `number`/`toggle`; the catalog hands it the actual names up front.
    expect(names).toContain('numberInput');
    expect(names).toContain('booleanInput');
    expect(names).not.toContain('number');
    expect(names).not.toContain('toggle');
  });

  it('is self-sufficient — every factory carries a compile-verified example + notes', () => {
    const cat = listDxFactoriesCatalog();
    for (const f of cat.factories) {
      expect(f.example).toContain(`gui.${f.namespace}.${f.factory}`);
      expect(Array.isArray(f.notes)).toBe(true);
    }
  });

  it('includes the full patterns (example + notes) and the common note with the validator rule', () => {
    const cat = listDxFactoriesCatalog();
    const cv = cat.patterns.find((p) => p.name === 'conditionalVisibility');
    expect(cv?.example).toContain('include');
    expect(cv?.notes.length).toBeGreaterThan(0);
    expect(cat.common).toContain('GuiForm');
    // The single consistent validator-`type` rule the agent kept thrashing on.
    expect(cat.common).toMatch(/type.*array/i);
    expect(cat.common).toMatch(/type: 'string'/);
  });

  it('stays a reasonable one-shot reference (self-sufficient but not unbounded)', () => {
    // Richer than a name index by design (carries examples+notes), but still one compact payload.
    // ~4K resident buys convergence (the alternative is a ~1M-token discovery loop). The budget still
    // holds a real ceiling — keep additions earning their bytes.
    const bytes = JSON.stringify(listDxFactoriesCatalog('react')).length;
    // 2026-07: 21500 -> 22000 for the timePicker factory
    // 2026-07: 22000 -> 23000 for the dateTimeCalendar factory
    expect(bytes).toBeLessThan(23000);
  });

  it('tailors the common note imports + render to the requested framework', () => {
    const cases: Array<[Parameters<typeof listDxFactoriesCatalog>[0], string, string]> = [
      ['react', '@golemui/gui-react', 'formSubmit={'],
      ['angular', '@golemui/gui-angular', '(formSubmit)='],
      ['vue', '@golemui/gui-vue', '@form-submit='],
      ['lit', '@golemui/gui-lit', '<gui-form'],
    ];
    for (const [fw, pkg, wiring] of cases) {
      const common = listDxFactoriesCatalog(fw).common;
      expect(common).toContain(pkg);
      expect(common).toContain(wiring);
      // `gui` is always from gui-shared, regardless of framework.
      expect(common).toContain("import { gui } from '@golemui/gui-shared'");
    }
    // A React catalog must NOT leak another framework's component package.
    expect(listDxFactoriesCatalog('react').common).not.toContain('@golemui/gui-vue');
  });
});
