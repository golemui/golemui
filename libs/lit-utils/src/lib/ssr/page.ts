// Renders the elements of a page that a framework rendered on the server: Vue, Nuxt, Angular and
// Analog render the tags with their attributes, empty. Both functions render the same elements,
// those registered through safeDefine that render into their light DOM (`serverRenderedClass`),
// whatever their tag.
import {
  onElementRegistered,
  rendersIntoLightDom,
  SERVER_RENDERED_ATTRIBUTE,
  serverRenderedClass,
  tagNameOf,
} from '../define';
import {
  applyEdits,
  attributeOf,
  isElement,
  isEmpty,
  type MarkupEdit,
  nodesOf,
  parseMarkup,
} from './markup';
import { renderElement } from './render';

// The tags of the elements these functions render, kept as elements register. A page without any
// of them has nothing to render, which a text search tells far faster than parsing it.
const renderedTags = new Set<string>();
let renderedTagPattern: RegExp | null | undefined;
onElementRegistered((ctor) => {
  const tagName = tagNameOf(ctor);
  if (tagName && rendersIntoLightDom(ctor)) {
    renderedTags.add(tagName);
    renderedTagPattern = undefined;
  }
});

/** Whether the HTML has the start tag of an element these functions render. */
function hasRenderedTag(html: string): boolean {
  if (renderedTagPattern === undefined) {
    const tags = [...renderedTags].map((tag) => tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // HTML tag names are case-insensitive; a start tag ends its name with a space, `/` or `>`.
    renderedTagPattern = tags.length ? new RegExp(`<(?:${tags.join('|')})[\\s/>]`, 'i') : null;
  }
  return renderedTagPattern?.test(html) ?? false;
}

const warn = (tagName: string, error: unknown) =>
  console.warn(`[GolemUI] <${tagName}> could not be rendered on the server`, error);

/**
 * Renders the content of the elements in a page's HTML. Pass the HTML a framework rendered on the
 * server, a whole document or a part of one, and get it back with each empty element filled in.
 * Only those elements change: the rest of the HTML stays byte for byte as it was, so the
 * framework hydrates the markup it rendered.
 *
 * Each element is rendered from its attributes. A value the framework set as a property is not in
 * the HTML, so the server markup goes without it until the element renders in the browser. An
 * element with any content, or inside a `<template>`, is left alone, and so is an element that
 * fails to render.
 *
 * @param html - The page, or a part of it.
 * @returns The same HTML with the elements' content.
 * @example
 * import { renderToString } from 'vue/server-renderer';
 * import { renderElementsInHtml } from '@golemui/gui-components/ssr';
 *
 * const html = renderElementsInHtml(await renderToString(app));
 */
export function renderElementsInHtml(html: string): string {
  if (!hasRenderedTag(html)) {
    return html;
  }
  const edits: MarkupEdit[] = [];
  for (const node of nodesOf(parseMarkup(html), false)) {
    if (
      !isElement(node) ||
      !serverRenderedClass(node.tagName) ||
      !isEmpty(node) ||
      attributeOf(node, SERVER_RENDERED_ATTRIBUTE) !== undefined
    ) {
      continue;
    }
    const location = node.sourceCodeLocation;
    if (!location?.startTag || !location.endTag) {
      continue;
    }
    try {
      const attributes = Object.fromEntries(node.attrs.map(({ name, value }) => [name, value]));
      const rendered = renderElement(node.tagName, { attributes });
      if (rendered) {
        edits.push({
          start: location.startTag.startOffset,
          end: location.endTag.endOffset,
          text: rendered.outerHTML,
        });
      }
    } catch (error) {
      warn(node.tagName, error);
    }
  }
  return applyEdits(html, edits);
}

/**
 * Renders the content of the elements in a server-side DOM, such as the document Angular renders
 * into on the server: call it just before the DOM is serialized (Angular:
 * `BEFORE_APP_SERIALIZED`). It renders the same elements as {@link renderElementsInHtml}, and also
 * reads the values the framework set as properties, which are still on the element objects.
 *
 * @param root - The document or the element to look in.
 */
export function renderElementsInDocument(root: ParentNode): void {
  // querySelectorAll does not look into <template> content, like renderElementsInHtml.
  for (const element of Array.from(root.querySelectorAll('*'))) {
    const ctor = serverRenderedClass(element.localName) as
      | (CustomElementConstructor & { elementProperties?: Map<PropertyKey, unknown> })
      | undefined;
    if (
      !ctor ||
      element.hasAttribute(SERVER_RENDERED_ATTRIBUTE) ||
      Array.from(element.childNodes).some(
        // 3: a text node.
        (node) => node.nodeType !== 3 || node.textContent?.trim(),
      )
    ) {
      continue;
    }
    const attributes = Object.fromEntries(
      Array.from(element.attributes, ({ name, value }) => [name, value]),
    );
    // The values the framework assigned to the element object (Angular's `[value]` bindings).
    const properties: Record<string, unknown> = {};
    for (const name of ctor.elementProperties?.keys() ?? []) {
      if (typeof name === 'string' && Object.prototype.hasOwnProperty.call(element, name)) {
        properties[name] = (element as unknown as Record<string, unknown>)[name];
      }
    }
    try {
      const rendered = renderElement(element.localName, { attributes, properties });
      if (rendered) {
        for (const [name, value] of Object.entries(rendered.attributes)) {
          element.setAttribute(name, value);
        }
        element.innerHTML = rendered.innerHTML;
      }
    } catch (error) {
      warn(element.localName, error);
    }
  }
}
