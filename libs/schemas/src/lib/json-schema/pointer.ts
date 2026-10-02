import { type JsonSchema } from './types.js';

/** Escapes one JSON pointer segment (RFC 6901): `~` becomes `~0` and `/` becomes `~1`. */
export function escapePointerSegment(segment: string): string {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}

/** Reverses {@link escapePointerSegment}. `~1` is replaced first, as RFC 6901 requires. */
export function unescapePointerSegment(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

/**
 * Appends segments to a JSON pointer.
 *
 * @example
 * appendPointer('/properties', 'a/b'); // '/properties/a~1b'
 */
export function appendPointer(pointer: string, ...segments: (string | number)[]): string {
  return pointer + segments.map((segment) => `/${escapePointerSegment(String(segment))}`).join('');
}

/** A resolved `$ref`: the target and its JSON pointer in the root document, or why it failed. */
export type ResolvedRef = { target: unknown; pointer: string } | { error: string };

/**
 * Resolves a `$ref` inside the root document: `#`, or a `#/...` JSON pointer with percent
 * encoding and `~0`/`~1` escapes. A ref that starts with the root `$id` is local too.
 *
 * @example
 * resolveRef('#/$defs/Address', schema); // { target: schema.$defs.Address, pointer: '/$defs/Address' }
 */
export function resolveRef(ref: string, root: JsonSchema): ResolvedRef {
  const hashIndex = ref.indexOf('#');
  const documentPart = hashIndex === -1 ? ref : ref.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? '' : ref.slice(hashIndex + 1);

  if (documentPart !== '' && documentPart !== root['$id']) {
    return { error: `Only refs inside the same document are supported, found "${ref}".` };
  }
  if (fragment !== '' && !fragment.startsWith('/')) {
    return { error: `Anchor refs are not supported, found "${ref}".` };
  }

  let target: unknown = root;
  const segments: string[] = [];
  for (const encodedSegment of fragment === '' ? [] : fragment.slice(1).split('/')) {
    let segment: string;
    try {
      segment = unescapePointerSegment(decodeURIComponent(encodedSegment));
    } catch {
      return { error: `"${ref}" is not a valid URI fragment.` };
    }
    // An own-property check, so a pointer can never read from the prototype chain.
    if (
      target === null ||
      typeof target !== 'object' ||
      !Object.prototype.hasOwnProperty.call(target, segment)
    ) {
      return { error: `"${ref}" points to nothing in the document.` };
    }
    target = (target as Record<string, unknown>)[segment];
    segments.push(segment);
  }
  return { target, pointer: appendPointer('', ...segments) };
}

/**
 * The definition name a JSON pointer points to, or `undefined` when it does not point to a
 * `$defs`, `definitions` or OpenAPI `components/schemas` entry.
 *
 * @example
 * definitionNameOf('/components/schemas/User'); // 'User'
 * definitionNameOf('/$defs/User/properties/name'); // undefined
 */
export function definitionNameOf(pointer: string): string | undefined {
  const match = /(?:^|\/)(?:\$defs|definitions|components\/schemas)\/([^/]+)$/.exec(pointer);
  return match ? unescapePointerSegment(match[1]) : undefined;
}
