import { describe, expect, it } from 'vitest';
import { legacyFormAliasSchema } from '@golemui/schemas';
import formSchema from './form.schema.json';

// The legacy URL https://golemui.com/schemas/form.schema.json must keep resolving to
// the gui form envelope, or an idBase change silently orphans the advertised URL.
describe('legacy form schema alias', () => {
  it('resolves to the generated gui form envelope $id', () => {
    const resolved = new URL(legacyFormAliasSchema.$ref, legacyFormAliasSchema.$id).href;
    expect(resolved).toBe(formSchema.$id);
  });
});
