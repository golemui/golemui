import { describe, expect, it } from 'vitest';
import formSchema from './form.schema.json';

// The alias is a website build input owned by @golemui/schemas and is not published to
// npm, so it is read from its source location rather than imported as a package export.
// @ts-expect-error import.meta.glob is provided by Vite/Vitest at runtime
const aliasFiles: Record<string, { $id: string; $ref: string }> = import.meta.glob(
  '../../../../schemas/site/form.schema.json',
  { import: 'default', eager: true },
);

// The legacy URL https://golemui.com/schemas/form.schema.json must keep resolving to
// the gui form envelope, or an idBase change silently orphans the advertised URL.
describe('legacy form schema alias', () => {
  it('keeps the advertised legacy URL as the alias $id', () => {
    const aliases = Object.values(aliasFiles);
    expect(aliases).toHaveLength(1);
    // The literal matters: both the alias and the target could otherwise move together.
    expect(aliases[0].$id).toBe('https://golemui.com/schemas/form.schema.json');
  });

  it('resolves to the generated gui form envelope $id', () => {
    const aliases = Object.values(aliasFiles);
    expect(aliases).toHaveLength(1);
    const resolved = new URL(aliases[0].$ref, aliases[0].$id).href;
    expect(resolved).toBe(formSchema.$id);
  });
});
