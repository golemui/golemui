import { describe, expect, it } from 'vitest';

// The vendored copies in this directory are generated verbatim from the
// @golemui/schemas sources by `npm run generate:schemas`. The generator copies
// bytes, so byte identity is the contract and the comparison runs on raw file
// text. This spec fails when a source edit was not followed by regeneration,
// when a new core file was added but never vendored, or when a vendored copy
// no longer has a source.

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
