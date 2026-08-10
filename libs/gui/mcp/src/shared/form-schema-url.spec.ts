import { describe, expect, it } from 'vitest';
import { FORM_SCHEMA_URL } from './form-schema-url';

// The alias is a website build input owned by @golemui/schemas and is not published to
// npm, so it is read from its source location rather than imported as a package export.
// @ts-expect-error import.meta.glob is provided by Vite/Vitest at runtime
const aliasFiles: Record<string, { $id: string }> = import.meta.glob(
  '../../../../schemas/site/form.schema.json',
  { import: 'default', eager: true },
);

// Every emitted form definition points at FORM_SCHEMA_URL. This ties that constant to
// the alias file that keeps the URL resolving, so the two cannot move independently.
describe('the emitted form schema URL', () => {
  it('matches the $id of the legacy alias that keeps the URL resolving', () => {
    const aliases = Object.values(aliasFiles);
    expect(aliases).toHaveLength(1);
    expect(FORM_SCHEMA_URL).toBe(aliases[0].$id);
  });
});
