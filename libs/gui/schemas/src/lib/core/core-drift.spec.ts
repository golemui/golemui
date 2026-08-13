import { describe, expect, it } from 'vitest';
import { guiSchemaConfig } from '../widget-manifest';

// Vendored copies are generated from the @golemui/schemas sources and differ only in
// `$id`, which is rebased onto the gui tree. Fails on missed regeneration, unvendored
// or orphaned files.

// @ts-expect-error import.meta.glob is provided by Vite/Vitest at runtime
const vendoredFiles: Record<string, Record<string, unknown>> = import.meta.glob('./*.schema.json', {
  import: 'default',
  eager: true,
});

// @ts-expect-error import.meta.glob is provided by Vite/Vitest at runtime
const sourceFiles: Record<string, Record<string, unknown>> = import.meta.glob(
  '../../../../../schemas/src/lib/core/*.schema.json',
  { import: 'default', eager: true },
);

// Raw variants of the same globs: identity below is asserted on bytes, because the
// generator copies bytes verbatim apart from the rebased `$id`.
// @ts-expect-error import.meta.glob is provided by Vite/Vitest at runtime
const vendoredRawFiles: Record<string, string> = import.meta.glob('./*.schema.json', {
  query: '?raw',
  import: 'default',
  eager: true,
});

// @ts-expect-error import.meta.glob is provided by Vite/Vitest at runtime
const sourceRawFiles: Record<string, string> = import.meta.glob(
  '../../../../../schemas/src/lib/core/*.schema.json',
  { query: '?raw', import: 'default', eager: true },
);

function fileNames(globResult: Record<string, unknown>): string[] {
  return Object.keys(globResult)
    .map((path) => path.split('/').pop() as string)
    .sort();
}

// Same single-$id shape the generator's rebase step relies on.
function withNormalizedId(schemaText: string): string {
  return schemaText.replace(/"\$id":\s*"[^"]*"/g, '"$id": "<normalized>"');
}

describe('vendored core schemas stay in step with the @golemui/schemas sources', () => {
  it('vendors exactly the core files that exist in @golemui/schemas', () => {
    expect(fileNames(vendoredFiles).length).toBeGreaterThan(0);
    expect(fileNames(vendoredFiles)).toEqual(fileNames(sourceFiles));
  });

  it('keeps every vendored copy byte-identical to its source apart from $id', () => {
    const sourceByName = new Map(
      Object.entries(sourceRawFiles).map(([path, text]) => [path.split('/').pop(), text]),
    );
    for (const [path, text] of Object.entries(vendoredRawFiles)) {
      const name = path.split('/').pop() as string;
      expect(withNormalizedId(text), name).toBe(withNormalizedId(sourceByName.get(name) as string));
    }
  });

  // The $id must be the retrieval URI that sibling refs like `../core/common.schema.json`
  // resolve to, or the published gui tree cannot be loaded by $id alone.
  it('rebases every vendored $id onto the gui tree', () => {
    for (const [path, schema] of Object.entries(vendoredFiles)) {
      const name = path.split('/').pop() as string;
      expect(schema['$id'], name).toBe(`${guiSchemaConfig.idBase}core/${name}`);
    }
  });
});
