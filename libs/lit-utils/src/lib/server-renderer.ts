/** One element rendered on the server: see `renderElement` in @golemui/lit-utils/ssr. */
export interface RenderedElement {
  /** The host's attributes after the render, including the ones the element added. */
  attributes: Record<string, string>;
  /** The content the element rendered into its light DOM. */
  innerHTML: string;
  /** The whole element: its tag, the attributes and the content. */
  outerHTML: string;
}

/** The values to render an element with: attributes, as in HTML, and properties. */
export interface ElementRenderValues {
  attributes?: Record<string, string>;
  properties?: Record<string, unknown>;
}

/** Renders one element on the server, or returns undefined for one it does not render. */
export type ServerElementRenderer = (
  tagName: string,
  values?: ElementRenderValues,
) => RenderedElement | undefined;

// On globalThis rather than in this module, so every copy of the package in the process shares
// it: Next.js, for example, bundles a page's server components and its client components apart.
const SERVER_ELEMENT_RENDERER = Symbol.for('golemui.server-element-renderer');

type RendererSlot = { [SERVER_ELEMENT_RENDERER]?: ServerElementRenderer };

/**
 * Sets the server renderer. The server-only @golemui/lit-utils/ssr entry point sets it when it is
 * imported, so code that cannot import that entry point (a framework component rendered on the
 * server and in the browser alike) can still render elements on the server.
 */
export function setServerElementRenderer(renderer: ServerElementRenderer): void {
  (globalThis as RendererSlot)[SERVER_ELEMENT_RENDERER] = renderer;
}

/** The server renderer, once @golemui/lit-utils/ssr has been imported in this process. */
export function serverElementRenderer(): ServerElementRenderer | undefined {
  return (globalThis as RendererSlot)[SERVER_ELEMENT_RENDERER];
}
