type ChunkRef = { $ref: string };

function isChunkRef(widget: unknown): widget is ChunkRef {
  return (
    typeof widget === 'object' &&
    widget !== null &&
    '$ref' in widget &&
    typeof (widget as Record<string, unknown>)['$ref'] === 'string' &&
    Object.keys(widget).length === 1
  );
}

function resolveWidget(widget: unknown, chunks: Record<string, unknown>): unknown {
  if (isChunkRef(widget)) {
    if (!(widget.$ref in chunks)) {
      throw new Error(`No chunk module mapped for ref "${widget.$ref}"`);
    }
    const { $schema: _$schema, ...chunk } = chunks[widget.$ref] as Record<string, unknown>;
    return resolveWidget(chunk, chunks);
  }
  const record = widget as Record<string, unknown>;
  if (Array.isArray(record['children'])) {
    const children = record['children'].map((child) => resolveWidget(child, chunks));
    return { ...record, children };
  }
  return widget;
}

/**
 * Synchronous variant of gui-shared's `resolveChunkRefs` for chunk modules that were
 * imported by the bundler instead of fetched over HTTP. This is what lets a chunked
 * mock load in plain Node, where the fetch-and-baseUrl path does not exist.
 *
 * @param formJson - A form definition whose `form` array may contain `{ $ref }` nodes.
 * @param chunks - Imported chunk modules keyed by the literal `$ref` string.
 * @returns The definition with every ref replaced by its chunk, `$schema` stripped
 * from each chunk.
 */
export function resolveChunkRefsSync(
  formJson: Record<string, unknown>,
  chunks: Record<string, unknown>,
): Record<string, unknown> {
  const form = (formJson['form'] as unknown[]).map((widget) => resolveWidget(widget, chunks));
  return { ...formJson, form };
}
