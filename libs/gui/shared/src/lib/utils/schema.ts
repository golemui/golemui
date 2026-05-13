type ChunkRef = { $ref: string };

function isChunkRef(w: unknown): w is ChunkRef {
  return (
    typeof w === 'object' &&
    w !== null &&
    '$ref' in w &&
    typeof (w as Record<string, unknown>)['$ref'] === 'string' &&
    Object.keys(w).length === 1
  );
}

async function loadChunk(ref: string, baseUrl: string): Promise<unknown> {
  const url = new URL(ref, baseUrl).href;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load form chunk ${url}: ${res.status}`);
  const { $schema: _$schema, ...chunk } = (await res.json()) as Record<string, unknown>;
  return resolveWidget(chunk, url);
}

async function resolveWidget(widget: unknown, baseUrl: string): Promise<unknown> {
  if (isChunkRef(widget)) return loadChunk(widget.$ref, baseUrl);
  const w = widget as Record<string, unknown>;
  if (Array.isArray(w['children'])) {
    const children = await Promise.all(w['children'].map((c) => resolveWidget(c, baseUrl)));
    return { ...w, children };
  }
  return widget;
}

/**
 * Traverses a raw form JSON object and replaces every `{ "$ref": "path" }` widget
 * with the content of the referenced `.form-chunk.json` file, fetched asynchronously.
 *
 * Refs are resolved relative to `baseUrl`, so nested chunks resolve their own refs
 * relative to their own URL. The `$schema` key is stripped from loaded chunks as it
 * is editor-only metadata not expected by the form decoder.
 *
 * @param formJson - The parsed form JSON (top-level `{ states?, form: [...] }` object).
 * @param baseUrl - Base URL used to resolve relative `$ref` paths — typically the URL
 *   of the form JSON file itself (e.g. `import.meta.resolve('./my-form.form.json')`).
 * @returns A new object with all chunk refs inlined. The input is not mutated.
 */
export async function resolveChunkRefs(
  formJson: Record<string, unknown>,
  baseUrl: string,
): Promise<Record<string, unknown>> {
  const form = await Promise.all(
    (formJson['form'] as unknown[]).map((w) => resolveWidget(w, baseUrl)),
  );
  return { ...formJson, form };
}
