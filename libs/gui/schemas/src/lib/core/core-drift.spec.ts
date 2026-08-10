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

function fileNames(globResult: Record<string, unknown>): string[] {
  return Object.keys(globResult)
    .map((path) => path.split('/').pop() as string)
    .sort();
}

function withoutId(schema: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...schema };
  delete copy['$id'];
  return copy;
}

describe('vendored core schemas stay in step with the @golemui/schemas sources', () => {
  it('vendors exactly the core files that exist in @golemui/schemas', () => {
    expect(fileNames(vendoredFiles).length).toBeGreaterThan(0);
    expect(fileNames(vendoredFiles)).toEqual(fileNames(sourceFiles));
  });

  it('keeps every vendored copy identical to its source apart from $id', () => {
    const sourceByName = new Map(
      Object.entries(sourceFiles).map(([path, schema]) => [path.split('/').pop(), schema]),
    );
    for (const [path, schema] of Object.entries(vendoredFiles)) {
      const name = path.split('/').pop() as string;
      expect(withoutId(schema), name).toEqual(
        withoutId(sourceByName.get(name) as Record<string, unknown>),
      );
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
