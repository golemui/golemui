// Renders the elements registered through safeDefine to HTML: a lit template, or one element on
// its own for a framework's server render.
import { LitElementRenderer, render } from '@lit-labs/ssr';
import { collectResult, collectResultSync } from '@lit-labs/ssr/lib/render-result.js';
import { html, unsafeStatic } from 'lit/static-html.js';
import { serverRenderedClass } from '../define';
import {
  type ElementRenderValues,
  type RenderedElement,
  setServerElementRenderer,
} from '../server-renderer';
import { cleanServerMarkup, isElement, nodesOf, parseMarkup, type MarkupElement } from './markup';
import { installLitSsrSupport, RegisteredElementRenderer } from './support';

/**
 * Renders a lit template to an HTML string in plain Node.
 *
 * The output is complete light-DOM markup: an element registered through safeDefine that renders
 * into its light DOM has its content as children, marked as server markup. Every custom element
 * has the `defer-hydration` attribute, so in the browser the elements stay inert until
 * `resumeServerRendered()` removes it.
 *
 * @param template - A lit `html` template. Import the elements it uses first.
 * @param options - `keepMarkers` keeps the lit hydration marker comments (default false).
 * @returns The rendered markup.
 * @example
 * import { html } from 'lit';
 * import { renderTemplate } from '@golemui/gui-components/ssr';
 * import '@golemui/gui-components/textinput';
 *
 * const markup = await renderTemplate(html`<gui-textinput uid="email" label="Email"></gui-textinput>`);
 */
export async function renderTemplate(
  template: unknown,
  options?: { keepMarkers?: boolean },
): Promise<string> {
  installLitSsrSupport();
  const result = render(template, {
    deferHydration: true,
    elementRenderers: [RegisteredElementRenderer, LitElementRenderer],
  });
  return cleanServerMarkup(await collectResult(result), { keepMarkers: options?.keepMarkers });
}

// A valid attribute name: the characters HTML does not allow in one are whitespace, quotes,
// `>`, `/`, `=` and control characters.
// eslint-disable-next-line no-control-regex
const ATTRIBUTE_NAME = /^[^\s"'>/=\u0000-\u001f\u007f]+$/;

/**
 * Renders one element to HTML, synchronously: the element registered through safeDefine under
 * `tagName`, whatever its tag, when it renders into its light DOM. For any other tag it returns
 * undefined. The host gets the server-rendered marker, so the element replaces the content on its
 * first render in the browser.
 *
 * The other server entry points are built on it, and importing this module registers it as the
 * server renderer that framework components look up (see `serverElementRenderer`).
 *
 * @param tagName - The element's tag. Import the element first.
 * @param values - The attributes, as in HTML, and the properties, for values an attribute cannot
 * hold (such as an array of options).
 */
export function renderElement(
  tagName: string,
  values: ElementRenderValues = {},
): RenderedElement | undefined {
  if (!serverRenderedClass(tagName)) {
    return undefined;
  }
  installLitSsrSupport();

  // Applies the values to the element the template renders, and to none of the elements nested
  // in its content. The renderers are created in document order, so it is the first one.
  let pending = true;
  class ValuesRenderer extends RegisteredElementRenderer {
    constructor(name: string) {
      super(name);
      if (!pending || name !== tagName) {
        return;
      }
      pending = false;
      for (const [attribute, value] of Object.entries(values.attributes ?? {})) {
        if (ATTRIBUTE_NAME.test(attribute)) {
          this.setAttribute(attribute, value);
        }
      }
      for (const [property, value] of Object.entries(values.properties ?? {})) {
        this.setProperty(property, value);
      }
    }
  }

  // The tag is a registered custom element name, so it is safe to put in the template as is.
  const tag = unsafeStatic(tagName);
  const result = render(html`<${tag}></${tag}>`, {
    elementRenderers: [ValuesRenderer, LitElementRenderer],
  });
  const outerHTML = cleanServerMarkup(collectResultSync(result));

  const host = [...nodesOf(parseMarkup(outerHTML), false)].find(
    (node): node is MarkupElement => isElement(node) && node.tagName === tagName,
  );
  const location = host?.sourceCodeLocation;
  if (!host || !location?.startTag || !location.endTag) {
    throw new Error(`<${tagName}> rendered no element`);
  }
  return {
    attributes: Object.fromEntries(host.attrs.map(({ name, value }) => [name, value])),
    innerHTML: outerHTML.slice(location.startTag.endOffset, location.endTag.startOffset),
    outerHTML,
  };
}

setServerElementRenderer(renderElement);
