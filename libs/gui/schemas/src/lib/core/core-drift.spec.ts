import { describe, expect, it } from 'vitest';

// Vendored copies are verbatim byte copies of the @golemui/schemas sources, so raw
// file text must match. Fails on missed regeneration, unvendored or orphaned files.

// @ts-expect-error import.meta.glob is provided by Vite/Vitest at runtime
const vendoredFiles: Record<string, string> = import.meta.glob('./*.schema.json', {
  query: '?raw',
  import: 'default',
  eager: true,
});

// @ts-expect-error import.meta.glob is provided by Vite/Vitest at runtime
const sourceFiles: Record<string, string> = import.meta.glob(
  '../../../../../schemas/src/lib/core/*.schema.json',
  { query: '?raw', import: 'default', eager: true },
);

function fileNames(globResult: Record<string, string>): string[] {
  return Object.keys(globResult)
    .map((path) => path.split('/').pop() as string)
    .sort();
}

describe('vendored core schemas stay identical to the @golemui/schemas sources', () => {
  it('vendors exactly the core files that exist in @golemui/schemas', () => {
    expect(fileNames(vendoredFiles).length).toBeGreaterThan(0);
    expect(fileNames(vendoredFiles)).toEqual(fileNames(sourceFiles));
  });

  it('keeps every vendored copy byte-identical to its source', () => {
    const sourceByName = new Map(
      Object.entries(sourceFiles).map(([path, content]) => [path.split('/').pop(), content]),
    );
    for (const [path, content] of Object.entries(vendoredFiles)) {
      const name = path.split('/').pop() as string;
      expect(content, name).toBe(sourceByName.get(name));
    }
  });
});
