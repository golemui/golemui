// Reads server markup with a real HTML parser (parse5, the one @lit-labs/ssr uses) and changes it
// in place: each change is an edit at the source position the parser reports, so the rest of the
// markup stays byte for byte as it was. The frameworks hydrate against that markup, so it must not
// be re-serialized.
import { type DefaultTreeAdapterMap, parse } from 'parse5';
import { serverRenderedClass } from '../define';

export type MarkupNode = DefaultTreeAdapterMap['node'];
export type MarkupElement = DefaultTreeAdapterMap['element'];
type ParentNode = DefaultTreeAdapterMap['parentNode'];

/**
 * Parses a page or a part of one. It is always parsed as a document: a part gets the implied
 * `html`, `head` and `body` elements around it, which have no source position and are never
 * edited, so the positions of its own nodes are positions in the string that was passed.
 */
export function parseMarkup(markup: string): DefaultTreeAdapterMap['document'] {
  return parse(markup, { sourceCodeLocationInfo: true });
}

/**
 * Every node under `parent`, in document order. With `templates`, the content of each
 * `<template>` too, where the declarative shadow roots of a server render are.
 */
export function* nodesOf(parent: ParentNode, templates: boolean): Generator<MarkupNode> {
  for (const node of parent.childNodes) {
    yield node;
    if (isElement(node)) {
      if (node.tagName === 'template') {
        if (templates) {
          yield* nodesOf((node as DefaultTreeAdapterMap['template']).content, templates);
        }
      } else {
        yield* nodesOf(node, templates);
      }
    }
  }
}

export const isElement = (node: MarkupNode): node is MarkupElement => 'tagName' in node;

const isText = (node: MarkupNode): node is DefaultTreeAdapterMap['textNode'] =>
  node.nodeName === '#text';

const isComment = (node: MarkupNode): node is DefaultTreeAdapterMap['commentNode'] =>
  node.nodeName === '#comment';

export const attributeOf = (element: MarkupElement, name: string) =>
  element.attrs.find((attribute) => attribute.name === name)?.value;

/** Whether an element holds nothing but whitespace: no element, no comment, no text. */
export const isEmpty = (element: MarkupElement) =>
  element.childNodes.every((node) => isText(node) && !node.value.trim());

/** A change to the source: the text from `start` to `end` replaced with `text`. */
export interface MarkupEdit {
  start: number;
  end: number;
  text: string;
}

/** Applies edits that do not overlap, from the last to the first, so positions stay valid. */
export function applyEdits(source: string, edits: MarkupEdit[]): string {
  let result = source;
  let limit = Infinity;
  for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
    if (edit.end > limit) {
      throw new Error('Overlapping markup edits');
    }
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
    limit = edit.start;
  }
  return result;
}

// The HTML boolean attributes in the @lit-labs/ssr reflected-attributes table. The enumerated
// attributes of that table (`draggable`, `spellcheck`, `contenteditable`, `translate`) are not
// listed, because "false" is a real value for them.
const BOOLEAN_ATTRIBUTES = new Set([
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'ismap',
  'loop',
  'multiple',
  'muted',
  'novalidate',
  'open',
  'readonly',
  'required',
  'reversed',
  'selected',
]);

const isShadowRootTemplate = (element: MarkupElement) =>
  element.tagName === 'template' &&
  (attributeOf(element, 'shadowrootmode') !== undefined ||
    attributeOf(element, 'shadowroot') !== undefined);

// The comments lit writes for hydration: `<!--lit-part …-->`, `<!--/lit-part-->`,
// `<!--lit-node N-->`, and `<?>`, which HTML parses as a comment holding `?`.
const isHydrationMarker = (data: string) =>
  data === '?' ||
  data.startsWith('lit-part') ||
  data.startsWith('/lit-part') ||
  data.startsWith('lit-node ');

export interface CleanOptions {
  /** Keeps lit's hydration marker comments, for a client that hydrates the markup with lit. */
  keepMarkers?: boolean;
}

/**
 * Turns @lit-labs/ssr output into the markup a light-DOM element renders in the browser.
 *
 * - @lit-labs/ssr wraps every element's content in a `<template shadowrootmode>`, which the
 *   browser turns into a shadow root. An element that renders into its light DOM has none, so
 *   its wrapper is removed and the content stays as its children. An element with a shadow
 *   root keeps it.
 * - @lit-labs/ssr serializes a false boolean property as `checked="false"`, which HTML reads as
 *   true, so those attributes are removed.
 * - The hydration marker comments are removed, unless `keepMarkers` is set: the elements render
 *   again in the browser instead of hydrating, so nothing reads them.
 */
export function cleanServerMarkup(
  markup: string,
  { keepMarkers = false }: CleanOptions = {},
): string {
  const edits: MarkupEdit[] = [];
  for (const node of nodesOf(parseMarkup(markup), true)) {
    const location = node.sourceCodeLocation;
    if (!location) {
      continue;
    }
    if (isComment(node)) {
      if (!keepMarkers && isHydrationMarker(node.data)) {
        edits.push({ start: location.startOffset, end: location.endOffset, text: '' });
      }
      continue;
    }
    if (!isElement(node)) {
      continue;
    }
    const { startTag, endTag } = node.sourceCodeLocation ?? {};
    if (isShadowRootTemplate(node) && startTag && endTag) {
      const host = node.parentNode as MarkupElement | null;
      if (host && serverRenderedClass(host.tagName)) {
        edits.push({ start: startTag.startOffset, end: startTag.endOffset, text: '' });
        edits.push({ start: endTag.startOffset, end: endTag.endOffset, text: '' });
        continue;
      }
    }
    const attributeLocations = node.sourceCodeLocation?.attrs;
    if (attributeLocations) {
      for (const { name, value } of node.attrs) {
        const attribute = attributeLocations[name];
        if (attribute && value === 'false' && BOOLEAN_ATTRIBUTES.has(name)) {
          // The whitespace before the attribute goes with it.
          let start = attribute.startOffset;
          while (start > 0 && /\s/.test(markup[start - 1] ?? '')) {
            start--;
          }
          edits.push({ start, end: attribute.endOffset, text: '' });
        }
      }
    }
  }
  return applyEdits(markup, edits);
}
