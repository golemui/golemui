import { describe, expect, it } from 'vitest';
import { legacyFormAliasSchema } from '@golemui/schemas';
import formSchema from './form.schema.json';

// The legacy URL https://golemui.com/schemas/form.schema.json is kept working forever through
// a static alias schema published from @golemui/schemas. Its relative ref must keep resolving
// to the generated gui form envelope, or a change to guiSchemaConfig.idBase silently orphans
// the most-advertised schema URL.
describe('legacy form schema alias', () => {
  it('resolves to the generated gui form envelope $id', () => {
    const resolved = new URL(legacyFormAliasSchema.$ref, legacyFormAliasSchema.$id).href;
    expect(resolved).toBe(formSchema.$id);
  });
});
