import { describe, expect, it } from 'vitest';
import { guiWidgetManifest } from '../widget-manifest';

// Core decodes `defaultValue` on every input widget, but each component schema has to declare
// it separately because its type differs per widget (a string for textinput, an array of
// `{ start, end }` for rangeDateInput). A schema that forgets it does not just omit the field:
// `unevaluatedProperties: false` makes the schema reject a form that works at runtime, and the
// rejection surfaces as an opaque oneOf miss. Both directions are pinned here.
describe('component schema defaultValue parity', () => {
  // @ts-expect-error import.meta.glob is provided by Vite/Vitest at runtime
  const componentSchemas: Record<string, any> = import.meta.glob('./*.schema.json', {
    eager: true,
    import: 'default',
  });

  // Entries without a schemaFile (renderer) have no JSON representation at all.
  const schemaBearingEntries = guiWidgetManifest.filter((entry) => entry.schemaFile !== undefined);

  it('declares a root-level defaultValue on every input widget', () => {
    const missing = schemaBearingEntries
      .filter((entry) => entry.kind === 'input')
      .filter(
        (entry) => componentSchemas[`./${entry.schemaFile}`].properties?.defaultValue === undefined,
      )
      .map((entry) => `${entry.type} (${entry.schemaFile})`);

    expect(
      missing,
      `input widgets missing a root-level defaultValue: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('keeps defaultValue off every widget that does not bind a value', () => {
    const declared = schemaBearingEntries
      .filter((entry) => entry.kind !== 'input')
      .filter(
        (entry) => componentSchemas[`./${entry.schemaFile}`].properties?.defaultValue !== undefined,
      )
      .map((entry) => `${entry.type} (${entry.kind})`);

    expect(
      declared,
      `only input widgets bind a value, so these must not declare defaultValue: ${declared.join(', ')}`,
    ).toEqual([]);
  });

  // A blanket `true` or `{}` passes the parity check above while accepting any value, which is
  // the mistake the check exists to prevent.
  it('gives every input defaultValue a type instead of accepting anything', () => {
    const untyped = schemaBearingEntries
      .filter((entry) => entry.kind === 'input')
      .filter((entry) => {
        const defaultValue = componentSchemas[`./${entry.schemaFile}`].properties?.defaultValue;
        return (
          defaultValue === true ||
          (typeof defaultValue === 'object' && Object.keys(defaultValue).length === 0)
        );
      })
      .map((entry) => `${entry.type} (${entry.schemaFile})`);

    expect(
      untyped,
      `these defaultValue declarations accept any value, give them a type or a $ref: ${untyped.join(', ')}`,
    ).toEqual([]);
  });

  // The custom fallback is not a manifest entry. It discriminates on `kind` through its own
  // $defs, so only its input branch may carry defaultValue.
  it('keeps defaultValue on the input branch only in the custom fallback', () => {
    const customSchema = componentSchemas['./custom.schema.json'];

    expect(customSchema.properties?.defaultValue, 'custom.schema.json root').toBeUndefined();
    expect(
      customSchema.$defs.customInput.properties.defaultValue,
      '$defs.customInput',
    ).toBeDefined();
    for (const branch of ['customDisplay', 'customAction', 'customLayout']) {
      expect(customSchema.$defs[branch].properties.defaultValue, `$defs.${branch}`).toBeUndefined();
    }
  });
});
